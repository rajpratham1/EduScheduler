from typing import List, Dict, Any, Tuple, Optional
import random

class TimetableSolver:
    def __init__(
        self,
        faculty: List[Dict],
        subjects: List[Dict],
        classrooms: List[Dict],
        batches: List[Dict], # Assuming batches are derived from students data
        courses_to_schedule: List[Dict], # e.g., [{'subject_id': 'sub1', 'batch_id': 'batchA', 'duration': 1, 'required_faculty_id': 'fac1', 'is_lab': False, 'num_classes': 3}]
        time_slots: List[str] # e.g., ['Mon_9-10', 'Mon_10-11', ...]
    ):
        self.faculty = {f["id"]: f for f in faculty}
        self.subjects = {s["id"]: s for s in subjects}
        self.classrooms = {c["id"]: c for c in classrooms}
        self.batches = {b["id"]: b for b in batches}
        self.courses_to_schedule = courses_to_schedule
        self.time_slots = time_slots

        self.variables = [] # Each variable represents a single class instance to be scheduled
        self.domains = {}
        self.solution = {}

        self._initialize_variables_and_domains()

    def _initialize_variables_and_domains(self):
        # Create a variable for each class instance that needs to be scheduled
        for course in self.courses_to_schedule:
            for i in range(course.get("num_classes", 1)): # Schedule multiple instances if num_classes is specified
                var_name = f"{course["subject_id"]}_{course["batch_id"]}_instance_{i}"
                self.variables.append(var_name)

                # Define the domain for each variable: (time_slot, classroom_id, faculty_id)
                possible_assignments = []
                for ts in self.time_slots:
                    for cr_id, classroom in self.classrooms.items():
                        for fac_id, faculty_member in self.faculty.items():
                            # Basic domain filtering (can be expanded with more constraints)
                            if course.get("is_lab") and "lab" not in classroom.get("resources", []):
                                continue # Lab subjects need lab classrooms
                            if course.get("required_faculty_id") and course["required_faculty_id"] != fac_id:
                                continue # Assign specific faculty if required
                            
                            possible_assignments.append((ts, cr_id, fac_id))
                self.domains[var_name] = possible_assignments

    def _is_consistent(self, assignment: Dict[str, Tuple[str, str, str]]) -> bool:
        # Check hard constraints for the current assignment
        # 1. No two classes in the same room at the same time
        # 2. No faculty teaching two classes at the same time
        # 3. No student batch taking two classes at the same time

        time_room_map = {}
        time_faculty_map = {}
        time_batch_map = {}

        for var, (time_slot, classroom_id, faculty_id) in assignment.items():
            subject_id = var.split('_')[0]
            batch_id = var.split('_')[1]

            # Constraint 1: Room clash
            if (time_slot, classroom_id) in time_room_map:
                return False
            time_room_map[(time_slot, classroom_id)] = var

            # Constraint 2: Faculty clash
            if (time_slot, faculty_id) in time_faculty_map:
                return False
            time_faculty_map[(time_slot, faculty_id)] = var

            # Constraint 3: Batch clash
            if (time_slot, batch_id) in time_batch_map:
                return False
            time_batch_map[(time_slot, batch_id)] = var
            
            # Constraint: Classroom capacity (simplified - check if batch size exceeds capacity)
            # This would require batch size to be part of batch data or course data
            # For now, assuming all batches fit all classrooms

        return True

    def solve(self) -> Optional[Dict[str, Tuple[str, str, str]]]:
        # Basic backtracking search algorithm
        found_solution = self._backtrack({})
        self.solution = found_solution # Store the found solution
        return found_solution

    def _backtrack(self, assignment: Dict[str, Tuple[str, str, str]]) -> Optional[Dict[str, Tuple[str, str, str]]]:
        if len(assignment) == len(self.variables):
            return assignment # All variables assigned

        # Select an unassigned variable (e.g., the first one)
        unassigned_vars = [v for v in self.variables if v not in assignment]
        if not unassigned_vars:
            return assignment
        var = unassigned_vars[0]

        # Try each value in the domain of the selected variable
        random.shuffle(self.domains[var]) # Randomize for different solutions
        for value in self.domains[var]:
            new_assignment = {**assignment, var: value}
            if self._is_consistent(new_assignment):
                result = self._backtrack(new_assignment)
                if result is not None:
                    return result
        return None # No consistent assignment found for this branch

    def get_solution(self) -> Dict:
        if self.solution:
            formatted_timetable = []
            for var, (time_slot, classroom_id, faculty_id) in self.solution.items():
                subject_id = var.split('_')[0]
                batch_id = var.split('_')[1]
                formatted_timetable.append({
                    "subject": self.subjects.get(subject_id, {}).get("name", subject_id),
                    "batch": self.batches.get(batch_id, {}).get("name", batch_id),
                    "faculty": self.faculty.get(faculty_id, {}).get("name", faculty_id),
                    "classroom": self.classrooms.get(classroom_id, {}).get("name", classroom_id),
                    "time_slot": time_slot
                })
            return {"message": "Timetable generated successfully", "timetable": formatted_timetable}
        else:
            return {"message": "No timetable solution found."}