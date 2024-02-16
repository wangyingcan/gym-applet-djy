// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取数据库表
const db = cloud.database();
const _ = db.command;
const courseTable = db.collection('CourseTable');
const user = db.collection('user');
const canceledCourses = db.collection('canceledCourses');

// 云函数入口函数（传入参数是删除course的date、startHour）
exports.main = async (event, context) => {
  // 0.获取数据库查询所用参数
  const openid = cloud.getWXContext().OPENID;     // 查询user、ecanceledCourses表
  const date = event.date;             // 查询courseTable表
  const startHour = event.startHour;    // 查询courseTable表

  // 1 修改courseTable中的数据（students删除openid、修改status）
  // 1.1 查询courseTable中的数据（两个查询条件），同时局部修改字段（两个局部修改）
  await courseTable.where({
    date: date,
    'courses.startHour': startHour
  }).update({
    data: {
      'courses.$.students': _.pull(openid),
      'courses.$.status': 1
    }
  }).then(res => {
    console.log("更新成功", res);
  }).catch(err => {
    console.log("更新失败", err);
  });

  // 2 修改user表中的数据
  await user.where({
    _openid: openid
  }).update({
    data: {
      bookedCourseNum: _.inc(-1),
      canceledClassNum: _.inc(1)
    }
  }).then(res => {
    console.log("更新成功", res);
  }).catch(err => {
    console.log("更新失败", err);
  })

  // 3 增加canceledCourses表中的数据
  // 3.1查询是否有此人的取消记录
  const res = await canceledCourses.where({
    _openid: openid
  }).get();

  // 3.2获取取消时间
  const now =new Date()
  const cancelTime = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  // 3.3如果有过取消记录，则更新
  if (res.data.length > 0) {
    await canceledCourses.where({
      _openid: openid
    }).update({
      data:{
        canceledCourseRecords: _.push({
          date: date,
          startHour: startHour,
          cancelTime
        })
      }
    }).then(res => {
      console.log("更新成功", res);
    }).catch(err => {
      console.log("更新失败", err);
    })
  } else {
    // 3.4如果没有取消记录，则插入    
    await canceledCourses.add({
      data: {
        _openid: openid,
        canceledCourseRecords: [{
          date: date,
          startHour: startHour,
          cancelTime
        }]
      }
    }).then(res => {
      console.log("插入成功", res);
    }).catch(err => {
      console.log("插入失败", err);
    })
  }

}