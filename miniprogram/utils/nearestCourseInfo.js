function findNearestCourse(bookedCourseList) {
    // 初始化最近的课程信息和最近的时间
    let nearestCourse = null;
    let nearestTime = 0;

    // 遍历 bookedCourseList
    for (let course of bookedCourseList) {
        // 将日期和时间转换为 Date 对象
        const year = course.date.split('.')[0];
        const month = course.date.split('.')[1];
        const date = course.date.split('.')[2];
        let courseTime = new Date(year, month, date, course.startHour, 0, 0);

        // 如果 nearestTime 为 0 或 courseTime 更近，更新 nearestCourse 和 nearestTime
        if (nearestTime === 0 || courseTime.getTime() < nearestTime.getTime()) {
            nearestCourse = course;
            nearestTime = courseTime;
        }
    }

    // 解析最近的课程信息，解析出月、日、时、课程名
    let year = nearestCourse.date.split('.')[0];
    let month = nearestCourse.date.split('.')[1];
    let date = nearestCourse.date.split('.')[2];
    let hour = nearestCourse.startHour;
    let courseName = nearestCourse.courseName;

    return {
        year,
        month,
        date,
        hour,
        courseName
    }
}

module.exports = { findNearestCourse };