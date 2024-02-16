// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 获取CourseTable表、user表
const db = cloud.database();
const courseTable = db.collection('CourseTable');
const user=db.collection('user');

// 云函数入口函数
exports.main = async (event, context) => {
  // 0.初始化返回信息
  let bookedCourseList = [];  // 用户已预约课程列表
  let bookedCourseNum = 0;    // 用户已预约课程数

  // 1.获取用户的openid
  const {OPENID} =cloud.getWXContext();
  const openid=OPENID;

  // 2.获取今天时间信息
  const now = new Date();
  const numOfWeek = now.getDay();     // 星期：用于确定开放时间天数范围
  console.log("云端现在的星期：" + numOfWeek)
  const nowHour = now.getHours();      // 小时：用于确定今天剩下的开放时间
  console.log("云端现在的小时：" + nowHour)
  const today = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();  // 日期：查询courseTable的主键
  console.log("云端现在的日期：" + today)

  /** 3.星期筛选逻辑： 
   *      12  23  34  45  56 （周一需检索周一+周二，剩下组合同理）
   *      6012    （周六需检索周六+周日+下周一+下周二）
   *      012     （周日需检索周日+下周一+下周二）
  */
  if(numOfWeek>=1&&numOfWeek<=5){
    // 3.1周一 ~ 周五
    // 3.1.1构造明天的日期，用于查询明天的课表
    let tomorrowDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);
    let tomorrow = tomorrowDate.getFullYear() + '.' + (tomorrowDate.getMonth() + 1) + '.' + tomorrowDate.getDate();
    
    // 3.1.2查询today的课程courses
    let resToday=await courseTable.where({
      date:today
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的今日数据" + JSON.stringify(resToday.data[0].courses, null, 2));

    // 3.1.3查询tomorrow的课程courses
    let resTomorrow=await courseTable.where({
      date:tomorrow
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的明日数据" + JSON.stringify(resTomorrow.data[0].courses, null, 2));

    /*
     * 3.1.4遍历resToday，获取 startHour晚于nowHour & status为2 & course.students包含openid 的课程
     */
    if(resToday.data.length>0){   // 返回(res)数据(data)数组非零代表查询成功
      // 3.1.4.1获取今天的courses数组
      let courses=resToday.data[0].courses;
      // 3.1.4.2遍历courses数组
      for(let i=0;i<courses.length;i++){
        // 3.1.4.2.1获取当前课程
        let course=courses[i];
        // 3.1.4.2.2判断是否符合条件
        if(course.status===2 && course.startHour>nowHour && course.students.includes(openid)){
          // 3.1.4.2.3给course加上date属性
          course.date=today;
          bookedCourseList.push(course);
        }
      }
    }

    /**
     * 3.1.5遍历resTomorrow，获取  status为2  &  course.students包含openid  的课程
     */
    if(resTomorrow.data.length>0){
      // 3.1.5.1遍历明天courses数组
      let courses=resTomorrow.data[0].courses;
      for(let i=0;i<courses.length;i++){
        // 3.1.5.2判断课程是否符合条件
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=tomorrow;
          bookedCourseList.push(course);
        }
      }
    }
  }else if(numOfWeek===6){
    // 3.2周六
    // 3.2.1构造明天、下周一、下周二
    let tomorrowDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);
    let tomorrow = tomorrowDate.getFullYear() + '.' + (tomorrowDate.getMonth() + 1) + '.' + tomorrowDate.getDate();
    let afterMondayDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
    let afterMonday = afterMondayDate.getFullYear() + '.' + (afterMondayDate.getMonth() + 1) + '.' + afterMondayDate.getDate();
    let afterTuesdayDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
    let afterTuesday = afterTuesdayDate.getFullYear() + '.' + (afterTuesdayDate.getMonth() + 1) + '.' + afterTuesdayDate.getDate();

    // 3.2.2查询四天的课程courses
    let resToday=await courseTable.where({
      date:today
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的今日数据" + JSON.stringify(resToday.data[0].courses, null, 2));

    let resTomorrow=await courseTable.where({
      date:tomorrow
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的明日数据" + JSON.stringify(resTomorrow.data[0].courses, null, 2));

    let resAfterMonday=await courseTable.where({
      date:afterMonday
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的下周一数据" + JSON.stringify(resAfterMonday.data[0].courses, null, 2));

    let resAfterTuesday=await courseTable.where({
      date:afterTuesday
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的下周二数据" + JSON.stringify(resAfterTuesday.data[0].courses, null, 2));

    // 3.2.3遍历resToday，获取 startHour晚于nowHour & status为2 & course.students包含openid 的课程
    if(resToday.data.length>0){
      let courses=resToday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.startHour>nowHour && course.students.includes(openid)){
          course.date=today;
          bookedCourseList.push(course);
        }
      }
    }

    // 3.2.4遍历resTomorrow，获取  status为2  &  course.students包含openid  的课程
    if(resTomorrow.data.length>0){
      let courses=resTomorrow.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=tomorrow;
          bookedCourseList.push(course);
        }
      }
    }

    // 3.2.5遍历resAfterMonday，获取  status为2  &  course.students包含openid  的课程
    if(resAfterMonday.data.length>0){
      let courses=resAfterMonday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=afterMonday;
          bookedCourseList.push(course);
        }
      }
    }

    // 3.2.6遍历resAfterTuesday，获取  status为2  &  course.students包含openid  的课程
    if(resAfterTuesday.data.length>0){
      let courses=resAfterTuesday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=afterTuesday;
          bookedCourseList.push(course);
        }
      }
    }

  }else{
    // 3.3周日
    // 3.3.1构造下周一、下周二
    let afterMondayDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);
    let afterMonday = afterMondayDate.getFullYear() + '.' + (afterMondayDate.getMonth() + 1) + '.' + afterMondayDate.getDate();
    let afterTuesdayDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
    let afterTuesday = afterTuesdayDate.getFullYear() + '.' + (afterTuesdayDate.getMonth() + 1) + '.' + afterTuesdayDate.getDate();

    // 3.3.2查询三天的课程courses
    let resToday=await courseTable.where({
      date:today
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的今日数据" + JSON.stringify(resToday.data[0].courses, null, 2));

    let resAfterMonday=await courseTable.where({
      date:afterMonday
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的下周一数据" + JSON.stringify(resAfterMonday.data[0].courses, null, 2));

    let resAfterTuesday=await courseTable.where({
      date:afterTuesday
    }).field({
      courses:true
    }).get();

    console.log("云函数打印获取的下周二数据" + JSON.stringify(resAfterTuesday.data[0].courses, null, 2));

    // 3.3.3遍历resToday，获取 startHour晚于nowHour & status为2 & course.students包含openid 的课程
    if(resToday.data.length>0){
      let courses=resToday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.startHour>nowHour && course.students.includes(openid)){
          course.date=today;
          bookedCourseList.push(course);
        }
      }
    }

    // 3.3.4遍历resAfterMonday，获取  status为2  &  course.students包含openid  的课程
    if(resAfterMonday.data.length>0){
      let courses=resAfterMonday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=afterMonday;
          bookedCourseList.push(course);
        }
      }
    }

    // 3.3.5遍历resAfterTuesday，获取  status为2  &  course.students包含openid  的课程
    if(resAfterTuesday.data.length>0){
      let courses=resAfterTuesday.data[0].courses;
      for(let i=0;i<courses.length;i++){
        let course=courses[i];
        if(course.status===2 && course.students.includes(openid)){
          course.date=afterTuesday;
          bookedCourseList.push(course);
        }
      }
    }
  }

  // 4.将bookedCourseNum写入user表
  bookedCourseNum=bookedCourseList.length;
  await user.where({
    _openid:openid
  }).update({
    data:{
    bookedCourseNum
    }
  }).then(res=>{
    console.log("更新成功",res);
  }).catch(err => {
    console.log("更新失败",err);
  })
  
  // 5.构造返回结果并返回
  return {
    bookedCourseList,
    bookedCourseNum
  }
}