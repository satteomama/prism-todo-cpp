#pragma once

#include <QString>
#include <vector>
#include "models/Task.h"

struct User {
    QString username;
    QString password;
    std::vector<Task> tasks;
};
