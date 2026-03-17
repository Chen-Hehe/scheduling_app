from __future__ import annotations

from typing import Dict, List, Optional, Literal

from pydantic import BaseModel, ConfigDict, Field, RootModel


class MemberCheckResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    student_id: str = Field(alias="studentId")
    name: str
    department: str
    position: str
    has_submitted: bool = Field(alias="hasSubmitted")


class PreferenceShiftIn(BaseModel):
    shift_id: str
    rank: int = Field(ge=1)


class PreferencesSubmitRequest(BaseModel):
    student_id: str
    shifts: List[PreferenceShiftIn]


class MessageResponse(BaseModel):
    message: str


class MemberShift(BaseModel):
    id: str
    week: Literal["单周", "双周"] | str
    day: str
    time: str


class MemberOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    student_id: str = Field(alias="studentId")
    name: str
    department: str
    position: str
    submitted: bool
    shifts: List[MemberShift]
    submit_time: Optional[str] = Field(default=None, alias="submitTime")


class RosterStatusResponse(BaseModel):
    submitted_members: List[MemberOut]
    unsubmitted_members: List[MemberOut]


class ScheduleMember(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    student_id: str = Field(alias="studentId")
    name: str
    department: str
    position: str
    submitted: bool
    shifts: List[MemberShift] = []
    is_leader: bool = False


class ScheduleResultResponse(RootModel[Dict[str, List[ScheduleMember]]]):
    pass


class Headcount(BaseModel):
    ministers: int
    vice_ministers: int
    officers: int


class RelatedShift(BaseModel):
    shift_id: str
    time_slot: str
    preference_rank: Optional[int] = None
    is_assigned: bool
    headcount: Headcount


class PersonalAdjustmentData(BaseModel):
    student_id: str
    name: str
    role: str
    current_count: int
    max_count: int
    related_shifts: List[RelatedShift]


class PersonalAdjustmentUpdateRequest(BaseModel):
    assigned_shift_ids: List[str]
    leader_shift_ids: List[str] = []  # shift_ids where this person is the leader


class MinRequiredConfig(BaseModel):
    min_required: int

