# app/main.py
from __future__ import annotations

from datetime import datetime
from io import BytesIO
from math import ceil
from typing import Dict, List, Tuple, Optional

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models
from .database import Base, SessionLocal, engine
from .schemas import (
    MemberCheckResponse,
    MessageResponse,
    PreferencesSubmitRequest,
    RosterStatusResponse,
    ScheduleResultResponse,
    PersonalAdjustmentData,
    PersonalAdjustmentUpdateRequest,
 )

# 创建所有模型对应的表（生产环境可以改为迁移工具 Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="志愿排班系统后端", version="0.1.0")

# CORS：允许前端（localhost:5173 / 5174 等）跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    """
    每个请求创建一个独立的数据库 Session，使用完自动关闭。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


def _parse_shift_id(shift_id: str) -> Tuple[str, str, str]:
    parts = shift_id.split("-")
    if len(parts) >= 3:
        return parts[0].strip(), parts[1].strip(), "-".join(parts[2:]).strip()
    return "未知", "未知", shift_id


def _read_roster_to_df(upload: UploadFile) -> pd.DataFrame:
    filename = (upload.filename or "").lower()
    content = upload.file.read()
    bio = BytesIO(content)

    if filename.endswith(".csv"):
        df = pd.read_csv(bio)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(bio)
    else:
        # 尝试按 Excel 读取，失败再按 CSV
        try:
            df = pd.read_excel(bio)
        except Exception:
            bio.seek(0)
            df = pd.read_csv(bio)

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="花名册文件为空或无法解析")
    return df


def _normalize_roster_columns(df: pd.DataFrame) -> pd.DataFrame:
    # 兼容常见中英文字段名
    col_map_candidates: Dict[str, List[str]] = {
        "student_id": ["student_id", "studentid", "学号", "学 号", "id", "账号", "工号"],
        "name": ["name", "姓名", "名字"],
        "department": ["department", "部门", "学院", "组织", "部门/学院"],
        "position": ["position", "职位", "岗位", "身份", "角色"],
    }

    normalized = {c: str(c).strip() for c in df.columns}
    reverse = {v.lower(): k for k, v in normalized.items()}

    rename: Dict[str, str] = {}
    for target, candidates in col_map_candidates.items():
        for cand in candidates:
            key = str(cand).strip().lower()
            if key in reverse:
                rename[reverse[key]] = target
                break

    df2 = df.rename(columns=rename).copy()
    required = ["student_id", "name", "department", "position"]
    missing = [c for c in required if c not in df2.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"花名册缺少必需列: {missing}。需要包含: student_id/name/department/position（可用中文列名）",
        )

    df2 = df2[required].copy()
    df2["student_id"] = df2["student_id"].astype(str).str.strip()
    df2["name"] = df2["name"].astype(str).str.strip()
    df2["department"] = df2["department"].astype(str).str.strip()
    df2["position"] = df2["position"].astype(str).str.strip()
    df2 = df2[df2["student_id"] != ""]
    return df2


@app.get("/api/members/check", response_model=MemberCheckResponse)
def check_member(
    student_id: str,
    name: str,
    db: Session = Depends(get_db),
):
    member = (
        db.query(models.Member)
        .filter(
            models.Member.student_id == student_id,
            models.Member.name == name,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="学号或姓名不在花名册中")

    return MemberCheckResponse(
        studentId=member.student_id,
        name=member.name,
        department=member.department,
        position=member.position,
        hasSubmitted=member.has_submitted,
    )


@app.post("/api/preferences", response_model=MessageResponse)
def submit_preferences(payload: PreferencesSubmitRequest, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.student_id == payload.student_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员不存在，请先导入花名册")

    # 清理旧志愿（允许重新提交）
    db.query(models.Preference).filter(models.Preference.student_id == payload.student_id).delete()

    # 写入 shift（若不存在则自动创建）与 preferences
    seen_shift_ids = set()
    for s in payload.shifts:
        if s.shift_id in seen_shift_ids:
            raise HTTPException(status_code=400, detail=f"重复的 shift_id: {s.shift_id}")
        seen_shift_ids.add(s.shift_id)

        shift = db.query(models.Shift).filter(models.Shift.shift_id == s.shift_id).first()
        if not shift:
            week, day, time_slot = _parse_shift_id(s.shift_id)
            shift = models.Shift(
                shift_id=s.shift_id,
                week=week,
                day=day,
                time_slot=time_slot,
                min_required=1,
            )
            db.add(shift)

        pref = models.Preference(
            student_id=payload.student_id,
            shift_id=s.shift_id,
            preference_rank=s.rank,
        )
        db.add(pref)

    member.has_submitted = True
    member.submit_time = datetime.now()

    db.commit()
    return MessageResponse(message="提交成功")


@app.post("/api/admin/roster/import", response_model=MessageResponse)
def import_roster(
    mode: str = "append",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    df = _read_roster_to_df(file)
    df = _normalize_roster_columns(df)

    inserted = 0
    updated = 0

    # 替换模式：清空现有花名册及相关志愿/排班，再全部重新导入
    if mode == "replace":
        db.query(models.Preference).delete()
        db.query(models.Schedule).delete()
        db.query(models.Member).delete()
        db.commit()

    for row in df.to_dict(orient="records"):
        sid = row["student_id"]
        existing = db.query(models.Member).filter(models.Member.student_id == sid).first()
        if existing:
            existing.name = row["name"]
            existing.department = row["department"]
            existing.position = row["position"]
            updated += 1
        else:
            db.add(
                models.Member(
                    student_id=sid,
                    name=row["name"],
                    department=row["department"],
                    position=row["position"],
                    has_submitted=False,
                    submit_time=None,
                )
            )
            inserted += 1

    db.commit()
    if mode == "replace":
        return MessageResponse(message=f"导入完成（替换模式）：共 {inserted} 人")
    return MessageResponse(message=f"导入完成（追加模式）：新增 {inserted}，更新 {updated}")


@app.get("/api/admin/roster/status", response_model=RosterStatusResponse)
def roster_status(db: Session = Depends(get_db)):
    members: List[models.Member] = db.query(models.Member).order_by(models.Member.student_id.asc()).all()

    submitted_members = []
    unsubmitted_members = []

    for m in members:
        prefs = (
            db.query(models.Preference)
            .filter(models.Preference.student_id == m.student_id)
            .order_by(models.Preference.preference_rank.asc())
            .all()
        )
        shifts = []
        if m.has_submitted:
            for p in prefs:
                shift = db.query(models.Shift).filter(models.Shift.shift_id == p.shift_id).first()
                if shift:
                    shifts.append(
                        {
                            "id": shift.shift_id,
                            "week": shift.week,
                            "day": shift.day,
                            "time": shift.time_slot,
                        }
                    )
                else:
                    week, day, time_slot = _parse_shift_id(p.shift_id)
                    shifts.append(
                        {
                            "id": p.shift_id,
                            "week": week,
                            "day": day,
                            "time": time_slot,
                        }
                    )

        submit_time_str = m.submit_time.strftime("%Y-%m-%d %H:%M") if m.submit_time else None

        item = {
            "studentId": m.student_id,
            "name": m.name,
            "department": m.department,
            "position": m.position,
            "submitted": m.has_submitted,
            "shifts": shifts,
            "submitTime": submit_time_str,
        }

        if m.has_submitted:
            submitted_members.append(item)
        else:
            # 未提交：shifts 必须为空数组，submitTime 不返回或为 null 都可
            item["shifts"] = []
            item["submitTime"] = None
            unsubmitted_members.append(item)

    return RosterStatusResponse(
        submitted_members=submitted_members,
        unsubmitted_members=unsubmitted_members,
    )


def _max_count_by_position(position: str) -> int:
    pos = (position or "").strip()
    if pos in ("部长", "部长团"):
        return 2
    if pos in ("副部长",):
        return 2
    # 默认按“干事”为 1
    return 1


def _position_category(position: str) -> str:
    pos = (position or "").strip()
    if pos in ("部长", "部长团"):
        return "ministers"
    if pos in ("副部长", "副主席"):
        return "vice_ministers"
    return "officers"


def _pick_candidate_for_shift(
    shift_id: str,
    candidates: List[models.Member],
    pref_rank_map: Dict[Tuple[str, str], int],
    member_assigned_count: Dict[str, int],
    member_capacity: Dict[str, int],
) -> Optional[models.Member]:
    best: Optional[models.Member] = None
    best_score: Optional[Tuple[int, int, str]] = None
    for m in candidates:
        if member_assigned_count[m.student_id] >= member_capacity[m.student_id]:
            continue
        rank = pref_rank_map.get((m.student_id, shift_id))
        if rank is None:
            continue
        score = (rank, member_assigned_count[m.student_id], m.student_id)
        if best_score is None or score < best_score:
            best_score = score
            best = m
    return best


@app.post("/api/admin/schedule/generate", response_model=MessageResponse)
def generate_schedule(db: Session = Depends(get_db)):
    """
    清空 Schedule 表后生成排班：
    - 部长/副部最多 2 个班，干事最多 1 个班
    - 尽量优先满足低 rank 志愿
    - 尽量保证班次均匀，且尽量不空班
    """
    # 只对已提交志愿的成员进行排班
    members: List[models.Member] = (
        db.query(models.Member)
        .filter(models.Member.has_submitted.is_(True))
        .order_by(models.Member.student_id.asc())
        .all()
    )
    if not members:
        raise HTTPException(status_code=400, detail="暂无已提交志愿的成员，无法生成排班")

    # 班次以 shifts 表为准；如果 shifts 为空，则从 preferences 里推断
    shifts: List[models.Shift] = db.query(models.Shift).order_by(models.Shift.shift_id.asc()).all()
    if not shifts:
        pref_shift_ids = [r[0] for r in db.query(models.Preference.shift_id).distinct().all()]
        for sid in pref_shift_ids:
            week, day, time_slot = _parse_shift_id(sid)
            db.add(models.Shift(shift_id=sid, week=week, day=day, time_slot=time_slot, min_required=1))
        db.commit()
        shifts = db.query(models.Shift).order_by(models.Shift.shift_id.asc()).all()

    # 读取所有 preferences
    prefs: List[models.Preference] = (
        db.query(models.Preference)
        .order_by(models.Preference.student_id.asc(), models.Preference.preference_rank.asc())
        .all()
    )
    pref_rank_map: Dict[Tuple[str, str], int] = {(p.student_id, p.shift_id): p.preference_rank for p in prefs}

    # 每个人的容量
    member_capacity: Dict[str, int] = {m.student_id: _max_count_by_position(m.position) for m in members}
    member_assigned_count: Dict[str, int] = {m.student_id: 0 for m in members}

    # shift 当前人数
    shift_assignees: Dict[str, List[str]] = {s.shift_id: [] for s in shifts}

    # 先清空旧排班
    db.query(models.Schedule).delete()
    db.commit()

    # Step 1: 尽量让每个班次至少 1 人（不空班）
    for s in shifts:
        cand = _pick_candidate_for_shift(
            s.shift_id,
            members,
            pref_rank_map,
            member_assigned_count,
            member_capacity,
        )
        if cand is None:
            continue
        shift_assignees[s.shift_id].append(cand.student_id)
        member_assigned_count[cand.student_id] += 1

    # Step 2: 按 min_required 填满最低人数
    for s in shifts:
        while len(shift_assignees[s.shift_id]) < (s.min_required or 1):
            cand = _pick_candidate_for_shift(
                s.shift_id,
                members,
                pref_rank_map,
                member_assigned_count,
                member_capacity,
            )
            if cand is None:
                break
            if cand.student_id in shift_assignees[s.shift_id]:
                break
            shift_assignees[s.shift_id].append(cand.student_id)
            member_assigned_count[cand.student_id] += 1

    # Step 3: 继续填充，无视班次人数限制
    for m in members:
        while member_assigned_count[m.student_id] < member_capacity[m.student_id]:
            # 取该成员的志愿按 rank 排序
            m_prefs = [(sid, rank) for (msid, sid), rank in pref_rank_map.items() if msid == m.student_id]
            m_prefs.sort(key=lambda x: x[1])
            assigned = False
            for sid, _rank in m_prefs:
                if m.student_id in shift_assignees.get(sid, []):
                    continue
                shift_assignees.setdefault(sid, []).append(m.student_id)
                member_assigned_count[m.student_id] += 1
                assigned = True
                break
            if not assigned:
                break

    # 写入 Schedule 表
    now = datetime.now()
    for sid, student_ids in shift_assignees.items():
        for st in student_ids:
            db.add(models.Schedule(student_id=st, shift_id=sid, assigned_at=now))
    db.commit()

    return MessageResponse(message="排班生成成功")


@app.get("/api/admin/schedule", response_model=ScheduleResultResponse)
def get_schedule(db: Session = Depends(get_db)):
    rows: List[models.Schedule] = db.query(models.Schedule).order_by(models.Schedule.shift_id.asc()).all()
    if not rows:
        # RootModel 在 Pydantic v2 下用 root=... 初始化；这里直接返回 dict 交给 response_model 校验
        return {}

    # 预加载成员信息
    member_map: Dict[str, models.Member] = {
        m.student_id: m for m in db.query(models.Member).all()
    }

    result: Dict[str, List[Dict[str, str]]] = {}
    for r in rows:
        m = member_map.get(r.student_id)
        if not m:
            continue
        result.setdefault(r.shift_id, []).append(
            {
                "studentId": m.student_id,
                "name": m.name,
                "department": m.department,
                "position": m.position,
                "submitted": m.has_submitted,
                "shifts": [],
            }
        )

    return result


@app.get(
    "/api/admin/schedule/personal/{student_id}",
    response_model=PersonalAdjustmentData,
)
def get_personal_adjustment(student_id: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.student_id == student_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员不存在")

    # 当前已排班次数量
    current_count = db.query(models.Schedule).filter(models.Schedule.student_id == student_id).count()
    max_count = _max_count_by_position(member.position)

    # 该成员的志愿与排班
    prefs: List[models.Preference] = (
        db.query(models.Preference)
        .filter(models.Preference.student_id == student_id)
        .order_by(models.Preference.preference_rank.asc())
        .all()
    )
    pref_rank_map: Dict[str, int] = {p.shift_id: p.preference_rank for p in prefs}

    assigned_rows: List[models.Schedule] = (
        db.query(models.Schedule)
        .filter(models.Schedule.student_id == student_id)
        .all()
    )
    assigned_shift_ids = {r.shift_id for r in assigned_rows}

    # 相关班次 = 志愿 + 已排班 的并集
    related_shift_ids = set(pref_rank_map.keys()) | assigned_shift_ids
    if not related_shift_ids:
        # 没有相关班次时仍返回基础信息，related_shifts 为空
        return PersonalAdjustmentData(
            student_id=member.student_id,
            name=member.name,
            role=member.position,
            current_count=current_count,
            max_count=max_count,
            related_shifts=[],
        )

    # 预加载这些班次
    shifts: List[models.Shift] = (
        db.query(models.Shift)
        .filter(models.Shift.shift_id.in_(related_shift_ids))
        .all()
    )
    shift_map: Dict[str, models.Shift] = {s.shift_id: s for s in shifts}

    # 预加载这些班次的 headcount：查所有相关 shift_id 下的 Schedule + Member
    all_sched_rows: List[models.Schedule] = (
        db.query(models.Schedule)
        .filter(models.Schedule.shift_id.in_(related_shift_ids))
        .all()
    )
    member_map: Dict[str, models.Member] = {
        m.student_id: m for m in db.query(models.Member).all()
    }

    headcount_map: Dict[str, Dict[str, int]] = {sid: {"ministers": 0, "vice_ministers": 0, "officers": 0} for sid in related_shift_ids}
    for row in all_sched_rows:
        m2 = member_map.get(row.student_id)
        if not m2:
            continue
        cat = _position_category(m2.position)
        headcount_map[row.shift_id][cat] += 1

    related_shifts_payload: List[Dict] = []
    # 排序：先按 preference_rank（无志愿的放后）再按 shift_id
    def sort_key(sid: str) -> Tuple[int, str]:
        rank = pref_rank_map.get(sid)
        return (rank if rank is not None else 1_000_000, sid)

    for sid in sorted(related_shift_ids, key=sort_key):
        shift = shift_map.get(sid)
        if shift:
            time_slot_str = f"{shift.week} {shift.day} {shift.time_slot}"
        else:
            week, day, ts = _parse_shift_id(sid)
            time_slot_str = f"{week} {day} {ts}"

        hc = headcount_map.get(sid, {"ministers": 0, "vice_ministers": 0, "officers": 0})
        related_shifts_payload.append(
            {
                "shift_id": sid,
                "time_slot": time_slot_str,
                "preference_rank": pref_rank_map.get(sid),
                "is_assigned": sid in assigned_shift_ids,
                "headcount": hc,
            }
        )

    return PersonalAdjustmentData(
        student_id=member.student_id,
        name=member.name,
        role=member.position,
        current_count=current_count,
        max_count=max_count,
        related_shifts=related_shifts_payload,
    )


@app.put(
    "/api/admin/schedule/personal/{student_id}",
    response_model=MessageResponse,
)
def update_personal_adjustment(
    student_id: str,
    payload: PersonalAdjustmentUpdateRequest,
    db: Session = Depends(get_db),
):
    member = db.query(models.Member).filter(models.Member.student_id == student_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员不存在")

    # 确保所有 shift 存在，不存在的根据 shift_id 自动解析创建
    for sid in payload.assigned_shift_ids:
        if not db.query(models.Shift).filter(models.Shift.shift_id == sid).first():
            week, day, ts = _parse_shift_id(sid)
            db.add(
                models.Shift(
                    shift_id=sid,
                    week=week,
                    day=day,
                    time_slot=ts,
                    min_required=1,
                )
            )
    db.commit()

    # 删除旧记录，写入新记录
    db.query(models.Schedule).filter(models.Schedule.student_id == student_id).delete()

    now = datetime.now()
    for sid in payload.assigned_shift_ids:
        db.add(models.Schedule(student_id=student_id, shift_id=sid, assigned_at=now))

    db.commit()
    return MessageResponse(message="个人排班已更新")


# 如果你使用 `python -m app.main` 运行，也可以加上下面的入口
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)