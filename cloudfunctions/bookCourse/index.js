// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 0.获取数据库表CourseTable、user、canceledCourses
const db = cloud.database();
const _ = db.command;
const courseTable = db.collection('CourseTable');
const user = db.collection('user');
const canceledCourses = db.collection('canceledCourses');
const monthlyCards = db.collection('monthlyCards')
const weeklyCards = db.collection('weeklyCards')

// 云函数入口函数
exports.main = async (event, context) => {
  // 0.初始化变量、初始化常量
  let bookResult = false;
  let bookResult1 = false;
  let bookResult2 = false;
  let bookResult3 = false;
  let bookResult4 = false;
  const date = event.date;
  const startHour = event.startHour;
  const openid = cloud.getWXContext().OPENID;
  const { remainingDays } = event.selectCard;
  const { cardId, cardType } = event.selectCard;
  console.log("cardType", cardType)

  // 0.检查预约课程是否超出了卡的有效期
  const courseYear = date.split('.')[0];
  const courseMonth = date.split('.')[1];
  const courseDay = date.split('.')[2];
  const courseTime = new Date(courseYear, courseMonth - 1, courseDay);   // 约课时间
  const now = new Date();   // 当前时间
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);  // 今天零点的时间
  if ((courseTime - todayTime) > remainingDays * 1000 * 60 * 60 * 24) {  // 约课时间已经超出了卡的有效时间
    return {
      bookResult: false
    }
  }

  // 1. 修改CourseTable
  // 1.1查询并更新status、students
  await courseTable.where({
    date: date,
    'courses.startHour': startHour
  }).update({
    data: {
      'courses.$.status': 2,
      'courses.$.students': _.push(openid)
    }
  }).then(res => {
    console.log("courseTable更新成功", res);
    bookResult1 = true;
  }).catch(err => {
    console.log("courseTable更新失败", err);
  });

  // 4.将月卡的remainingBookCount-1，无脑进行的操作
  if (cardType === "月卡") {
    await monthlyCards.where({
      cardId: cardId
    }).update({
      data: {
        remainingBookCount: _.inc(-1)
      }
    }).then(res => {
      console.log("monthlyCards更新成功", res);
      bookResult4 = true;
    }).catch(err => {
      console.log("monthlyCards更新失败", err);
    });
  }

  // 5.将周卡的remainingBookCount-1，无脑进行的操作
  if (cardType === "周卡") {
    await weeklyCards.where({
      cardId: cardId
    }).update({
      data: {
        remainingBookCount: _.inc(-1),
        totalBookCount: _.inc(-1)
      }
    }).then(res => {
      console.log("weeklyCards更新成功", res);
      bookResult4 = true;
    }).catch(err => {
      console.log("weeklyCards更新失败", err);
    })
  }

  //2. 修改`canceledCourses`，如果存在已经取消过再预约的课程，就需要将对应记录删除
  //2.1 查询此人是否取消过这课程的预约记录
  let res = await canceledCourses.where({
    _openid: openid,
    'canceledCourseRecords.date': date,
    'canceledCourseRecords.startHour': startHour
  }).get();

  // 2.2存在
  if (res.data.length > 0) {
    // 删除局部记录
    await canceledCourses.where({
      _openid: openid,
      'canceledCourseRecords.date': date,
      'canceledCourseRecords.startHour': startHour
    }).update({
      data: {
        canceledCourseRecords: _.pull({
          date: date,
          startHour: startHour
        })
      }
    }).then(res => {
      console.log("canceledCourses更新成功", res);
      bookResult2 = true;
    }).catch(err => {
      console.log("canceledCourses更新失败", err);
    });
  } else {
    // 2.3不存在，直接返回了
    bookResult = bookResult1 && bookResult4;
    return {
      bookResult
    }
  }

  //3. 修改`user`中的`canceledClassNum`，如果存在上面的改动就需要自减
  await user.where({
    _openid: openid
  }).update({
    data: {
      canceledClassNum: _.inc(-1)
    }
  }).then(res => {
    console.log("user更新成功", res);
    bookResult3 = true;
  }).catch(err => {
    console.log("user更新失败", err);
  });

  // 5.返回数据
  bookResult = bookResult1 && bookResult2 && bookResult3 && bookResult4;
  return {
    bookResult
  }
}