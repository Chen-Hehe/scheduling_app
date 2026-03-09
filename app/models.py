from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class Member(Base):
    __tablename__ = "members"

    student_id = Column(String(32), primary_key=True, index=True, unique=True)
    name = Column(String(64), nullable=False, index=True)
    department = Column(String(64), nullable=False)
    position = Column(String(32), nullable=False)

    has_submitted = Column(Boolean, nullable=False, default=False)
    submit_time = Column(DateTime, nullable=True)

    preferences = relationship(
        "Preference",
        back_populates="member",
        cascade="all, delete-orphan",
    )
    schedules = relationship(
        "Schedule",
        back_populates="member",
        cascade="all, delete-orphan",
    )


class Shift(Base):
    __tablename__ = "shifts"

    shift_id = Column(String(64), primary_key=True, index=True, unique=True)
    week = Column(String(16), nullable=False)
    day = Column(String(16), nullable=False)
    time_slot = Column(String(32), nullable=False)
    min_required = Column(Integer, nullable=False, default=1)

    preferences = relationship(
        "Preference",
        back_populates="shift",
        cascade="all, delete-orphan",
    )
    schedules = relationship(
        "Schedule",
        back_populates="shift",
        cascade="all, delete-orphan",
    )


class Preference(Base):
    __tablename__ = "preferences"

    student_id = Column(
        String(32),
        ForeignKey("members.student_id", ondelete="CASCADE"),
        primary_key=True,
    )
    shift_id = Column(
        String(64),
        ForeignKey("shifts.shift_id", ondelete="CASCADE"),
        primary_key=True,
    )
    preference_rank = Column(Integer, nullable=False)

    member = relationship("Member", back_populates="preferences")
    shift = relationship("Shift", back_populates="preferences")


class Schedule(Base):
    __tablename__ = "schedules"

    student_id = Column(
        String(32),
        ForeignKey("members.student_id", ondelete="CASCADE"),
        primary_key=True,
    )
    shift_id = Column(
        String(64),
        ForeignKey("shifts.shift_id", ondelete="CASCADE"),
        primary_key=True,
    )

    assigned_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    member = relationship("Member", back_populates="schedules")
    shift = relationship("Shift", back_populates="schedules")