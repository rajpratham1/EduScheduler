from fastapi import APIRouter

from app.api.v1.endpoints.admin import faculty, students, subjects, classrooms, timetables, schedule, users, electives, cultural_sessions, courses, assignments, settings

router = APIRouter()

router.include_router(courses.router, prefix="/courses", tags=["admin-courses"])
router.include_router(assignments.router, prefix="/assignments", tags=["admin-assignments"])
router.include_router(settings.router, prefix="/settings", tags=["admin-settings"])
router.include_router(faculty.router, prefix="/faculty", tags=["admin-faculty"])
router.include_router(students.router, prefix="/students", tags=["admin-students"])
router.include_router(subjects.router, prefix="/subjects", tags=["admin-subjects"])
router.include_router(classrooms.router, prefix="/classrooms", tags=["admin-classrooms"])
router.include_router(timetables.router, prefix="/timetables", tags=["admin-timetables"])
router.include_router(schedule.router, prefix="/schedule", tags=["admin-schedule"])
router.include_router(users.router, prefix="/users", tags=["admin-users"])
router.include_router(electives.router, prefix="/electives", tags=["admin-electives"])
router.include_router(cultural_sessions.router, prefix="/cultural-sessions", tags=["admin-cultural-sessions"])
