import type { LessonTask } from "../../types/lesson";
import { TaskDatabase } from "./task-database";

/**
 * Keeps lesson content coupled to the database wrapper at one small adapter
 * boundary; the runtime itself remains reusable and content-independent.
 */
export function createTaskDatabaseForLesson(task: LessonTask): TaskDatabase {
  return new TaskDatabase({
    taskId: task.id,
    setupSql: task.setupSql,
    forbiddenOperations: task.forbiddenOperations.map(String),
    maxRows: 200,
  });
}

