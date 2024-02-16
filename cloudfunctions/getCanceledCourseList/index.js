// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 0.获取canceledCourses表、CourseTable表
const db = cloud.database();
const canceledCourses = db.collection('canceledCourses');
const courseTable = db.collection('CourseTable');


// 云函数入口函数
exports.main = async (event, context) => {
  // 1.初始化返回数据
  let canceledCourseList = [];  // 用户取消课程列表
  let canceledCourseNum = 0;    // 用户取消课程数

  // 2.获取用户的openid
  const openid = cloud.getWXContext().OPENID;

  // 3.查询canceledCourses表，获取用户取消课程列表
  let res = await canceledCourses.where({
    _openid: openid
  }).field({
    canceledCourseRecords: true
  }).get();

  // 4.判断是否查询成功
  if (res.data.length > 0) {
    // 4.1遍历每一个canceledCourseRecords，获取课程信息
    for( let canceledCourse of res.data[0].canceledCourseRecords){
      // 4.2根据canceledCourse中的date、startHour属性查询CourseTable表，获取课程信息
      let resCourseInfo=await courseTable.where({
        date:canceledCourse.date,
        'courses.startHour':canceledCourse.startHour
      }).field({
        courses:true
      }).get();

      // 4.3判断是否查询成功
      if(resCourseInfo.data.length>0){
        // 4.3.1获取课程信息，添加到canceledCourse中
        canceledCourse.coachName=resCourseInfo.data[0].courses[0].coachName;
        canceledCourse.courseName=resCourseInfo.data[0].courses[0].courseName;
        canceledCourse.courseLength=resCourseInfo.data[0].courses[0].courseLength;
        // 4.3.2将canceledCourse添加到canceledCourseList中
        canceledCourseList.push(canceledCourse);
        // 4.3.3取消课程数+1
        canceledCourseNum++;
      }
      // 4.4正常来说取消记录表中存在，不可能不存在于课程表中，所以无需判断查询失败
    }
  }
  // 4.5无需判断查询失败，因为canceledCourseList已经初始化为空数组，canceledCourseNum已经初始化为0

  // 5.返回数据
  return {
    canceledCourseList,
    canceledCourseNum
  }
}