// Convert backend task format to frontend format
export function mapTaskFromBackend(backendTask) {
  return {
    id: backendTask.id,
    name: backendTask.title,
    description: backendTask.description,
    deadline: backendTask.dueDate,
    status: backendTask.status,
    completed: backendTask.status === "COMPLETED",
    createdAt: backendTask.createdAt,
  };
}

// Convert frontend task format to backend format
export function mapTaskToBackend(frontendTask) {
  return {
    title: frontendTask.name,
    description: frontendTask.description,
    dueDate: frontendTask.deadline,
    status: frontendTask.completed ? "COMPLETED" : "IN_PROGRESS",
  };
}

// Format date for API requests
export function formatDateForApi(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const formattedDate = date.toISOString().split("T")[0];

  return formattedDate;
}
