// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 1.获取数据库表
const db = cloud.database();
const courseTable = db.collection('CourseTable');

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("打印云函数的信息")
  // 1.获取当前的星期、小时、今天日期（2024.2.12形式）
  const now = new Date();
  console.log("云端现在的时间：" + now)
  const numOfWeek = now.getDay();
  console.log("云端现在的星期：" + numOfWeek)
  const nowHour = now.getHours();
  console.log("云端现在的小时：" + nowHour)
  const today = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();
  console.log("云端现在的日期：" + today)
  // 默认最初始的时候，是周一，周二数据正常，周三之后数据status默认是3
  // 2.每小时对当天课程的逻辑：同一天的课程（index+numOfWeek【注意周日】控制）当前小时（nowHour）如果超过 startHour+courseLength，将课程status改为3，写入数据库
  // 2.1获取courseTable中当天数据
  // 1. 查询
  let res = await courseTable.where({
    date: today
  }).field({
    courses: true
  }).get();

  console.log("云函数打印获取的数据" + JSON.stringify(res.data[0].courses, null, 2));

  if (res.data.length > 0) {
    // 2. 遍历
    let courses = res.data[0].courses;
    let needUpdate = false;
    for (let i = 0; i < courses.length; i++) {
      let course = courses[i];
      if (course.status !== 3 && course.startHour + course.courseLength <= nowHour) {
        courses[i].status = 3;
        needUpdate = true;
      }
    }

    // 3. 更新
    if (needUpdate) {
      await courseTable.doc(res.data[0]._id).update({
        data: {
          courses: courses
        }
      }).then(() => {
        console.log('更新成功');
      }).catch(err => {
        console.log('更新失败', err);
      });
    }
  } else {
    console.log('查询失败');
  }

  // 3.周一~周四 22点时的逻辑：将后天的课程status改为1，写入数据库
  // 3.1判断是否是周一~周四
  if (numOfWeek >= 1 && numOfWeek <= 4) {
    // 3.2判断是否已经到了22点
    if (nowHour == 22) {
      // 3.3获取后天的日期
      const afterTomorrowDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
      const afterTomorrow = afterTomorrowDate.getFullYear() + '.' + (afterTomorrowDate.getMonth() + 1) + '.' + afterTomorrowDate.getDate();
      // 3.4获取后天的课程
      let res = await courseTable.where({
        date: afterTomorrow
      }).field({
        courses: true
      }).get();

      // 3.5 打印后天课程数据
      console.log("云函数打印后天课程数据" + JSON.stringify(res.data[0].courses, null, 2));

      // 3.6遍历课程数据,将课程状态设置为1
      if (res.data.length > 0) {
        let courses = res.data[0].courses;
        for (let i = 0; i < courses.length; i++) {
          courses[i].status = 1;
        }

        // 3.7更新数据库
        await courseTable.doc(res.data[0]._id).update({
          data: {
            courses: courses
          }
        }).then(res => {
          console.log('更新成功', res)
        }).catch(err => {
          console.log('更新失败', err)
        })
      } else {
        console.log('查询失败');
      }
    }     // 22点
  }   // 周一~周四

  // 4.周五 22点时的逻辑：将周日、下周一、二的课程status改为1，写入数据库；开放”切换下一周“按钮
  // 4.1判断是否是周五
  if (numOfWeek == 5) {
    // 4.2判断是否已经到了22点
    if (nowHour == 22) {
      // 4.3获取周日、下周一、二的日期
      const sundayDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
      const nextMondayDate = new Date(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3));
      const nextTuesdayDate = new Date(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4));
      const sunday = sundayDate.getFullYear() + '.' + (sundayDate.getMonth()
        + 1) + '.' + sundayDate.getDate();
      const nextMonday = nextMondayDate.getFullYear() + '.' + (nextMondayDate.getMonth()
        + 1) + '.' + nextMondayDate.getDate();
      const nextTuesday = nextTuesdayDate.getFullYear() + '.' + (nextTuesdayDate.getMonth()
        + 1) + '.' + nextTuesdayDate.getDate();

      // 4.4获取周日的课程
      let res_sunday = await courseTable.where({
        date: sunday
      }).field({
        courses: true
      }).get();

      // 4.5打印周日课程数据
      console.log("云函数打印周日课程数据" + JSON.stringify(res_sunday.data[0].courses, null, 2));

      if (res_sunday.data.length > 0) {
        let courses = res_sunday.data[0].courses;
        for (let i = 0; i < courses.length; i++) {
          courses[i].status = 1;
        }
        // 4.6更新数据库
        await courseTable.doc(res_sunday.data[0]._id).update({
          data: {
            courses: courses
          }
        }).then(res => {
          console.log('更新成功', res)
        }).catch(err => {
          console.log('更新失败', err)
        })
      } else {
        console.log('查询失败');
      }

      // 4.7获取下周一的课程
      let res_nextMonday = await courseTable.where({
        date: nextMonday
      }).field({
        courses: true
      }).get();

      // 4.8打印下周一课程数据
      console.log("云函数打印下周一课程数据" + JSON.stringify(res_nextMonday.data[0].courses, null, 2));

      if (res_nextMonday.data.length > 0) {
        let courses = res_nextMonday.data[0].courses;
        for (let i = 0; i < courses.length; i++) {
          courses[i].status = 1;
        }
        // 4.9更新数据库
        await courseTable.doc(res_nextMonday.data[0]._id).update({
          data: {
            courses: courses
          }
        }).then(res => {
          console.log('更新成功', res)
        }).catch(err => {
          console.log('更新失败', err)
        })
      } else {
        console.log('查询失败');
      }

      // 4.10获取下周二的课程
      let res_nextTuesday = await courseTable.where({
        date: nextTuesday
      }).field({
        courses: true
      }).get();

      // 4.11打印下周二课程数据
      console.log("云函数打印下周二课程数据" + JSON.stringify(res_nextTuesday.data[0].courses, null, 2));

      if (res_nextTuesday.data.length > 0) {
        let courses = res_nextTuesday.data[0].courses;
        for (let i = 0; i < courses.length; i++) {
          courses[i].status = 1;
        }
        // 4.12更新数据库
        await courseTable.doc(res_nextTuesday.data[0]._id).update({
          data: {
            courses: courses
          }
        }).then(res => {
          console.log('更新成功', res)
        }).catch(err => {
          console.log('更新失败', err)
        })
      } else {
        console.log('查询失败');
      }

    }    // 22点判断

  }   // 周五判断

}   // 函数结束