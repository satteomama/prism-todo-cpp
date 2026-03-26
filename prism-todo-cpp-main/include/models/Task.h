#pragma once

#include <QString>
#include <nlohmann/json.hpp>

struct Task {
    int id = 0;
    QString title;
    QString description;
    QString priority; // High, Medium, Low
    bool completed = false;
    QString dueDate; // YYYY-MM-DD
};

nlohmann::json taskToJson(const Task& task);
Task taskFromJson(const nlohmann::json& j);
