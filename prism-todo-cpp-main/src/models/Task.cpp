#include "models/Task.h"

nlohmann::json taskToJson(const Task& task) {
    return {
        {"id", task.id},
        {"title", task.title.toStdString()},
        {"description", task.description.toStdString()},
        {"priority", task.priority.toStdString()},
        {"completed", task.completed},
        {"dueDate", task.dueDate.toStdString()}
    };
}

Task taskFromJson(const nlohmann::json& j) {
    Task task;
    task.id = j.value("id", 0);
    task.title = QString::fromStdString(j.value("title", ""));
    task.description = QString::fromStdString(j.value("description", ""));
    task.priority = QString::fromStdString(j.value("priority", "Low"));
    task.completed = j.value("completed", false);
    task.dueDate = QString::fromStdString(j.value("dueDate", ""));
    return task;
}
