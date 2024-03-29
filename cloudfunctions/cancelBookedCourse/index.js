// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取数据库表
const db = cloud.database();
const _ = db.command;
const courseTable = db.collection('CourseTable');
const user = db.collection('user');
const canceledCourses = db.collection('canceledCourses');
const monthlyCards=db.collection('monthlyCards');
const weeklyCards=db.collection('weeklyCards');

// 云函数入口函数（传入参数是删除course的date、startHour）
exports.main = async (event, context) => {
  // 0.获取数据库查询所用参数
  const openid = cloud.getWXContext().OPENID;     // 查询user、ecanceledCourses表
  const date = event.date;             // 查询courseTable表
  const startHour = event.startHour;    // 查询courseTable表
  const cardId = event.cardId;    // 查询monthlyCards表 或 weeklyCards表
  const cardType = event.cardType;    // 查询monthlyCards表 或 weeklyCards表
  const firstBook = event.firstBook;    // 查询monthlyCards表 或 weeklyCards表
  const isWithinTwoHours = event.isWithinTwoHours;    //月卡的判断
  let weeklyCardTotalBookCount=0; //获取每种周卡的总约课数量
  let type="";
  let totalBookCount=0;
  console.log("云函数canceledBookedCourse的cardId",cardId);
  console.log("云函数canceledBookedCourse的cardType",cardType);
  console.log("云函数canceledBookedCourse的firstBook",firstBook);

  // 0 周卡有、月卡没有的数据
  if(cardType=="周卡"){
    // 这里的type等信息需要通过cardId进行查询
    await weeklyCards.where({
      cardId:cardId
    }).get().then(res=>{
      console.log("查询周卡表的res",JSON.stringify(res))
      type=res.data[0].type;
      totalBookCount=res.data[0].totalBookCount;
    })
    console.log("云函数canceledBookedCourse的type",type);
    console.log("云函数canceledBookedCourse的totalBookCount",totalBookCount);
    // 0.1设置好每种卡的原始总约课数量
    if(type=="一周三练"){
      weeklyCardTotalBookCount=3;
    }else if(type=="一周四练"){
      weeklyCardTotalBookCount=4;
    }else{
      weeklyCardTotalBookCount=5;
    }
  }

  console.log("云函数canceledBookedCourse的weeklyCardTotalBookCount",weeklyCardTotalBookCount);

  // 1 修改courseTable中的数据（students删除openid、修改status）
  // 1.1 查询courseTable中的数据（两个查询条件），同时局部修改字段（多个局部修改）
  await courseTable.where({
    date: date,
    'courses.startHour': startHour
  }).update({
    data: {
      'courses.$.students': _.pull(openid),
      'courses.$.status': 1,
      'courses.$.cardId':"",
      'courses.$.cardType':"",
      'courses.$.firstBook':false
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

  // 4.修改monthlyCards信息（根据是否是第一次取消、是否在2小时内取消）
  if(firstBook && cardType=="月卡"){
    // 4.1 月卡第一次取消约课（变回add一张新卡的状态，2小时外）
    if(!isWithinTwoHours){
      await monthlyCards.where({
        cardId:cardId
      }).update({
        data:{
          status:"inactive",
          activationDate:"",
          firstBook:true,
          remainingBookCount:1,
          remainingDays:30
        }
      }).then(res=>{
        console.log("第一次取消预约时(2小时外)，月卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("第一次取消预约时(2小时外)，月卡更新状态失败",JSON.stringify(err,null,2))
      })
    }else{
      // 2小时内取消，扣次但是变成未激活，并需要给此卡添加一个今日2小时内取消过的字段
      await monthlyCards.where({
        cardId:cardId
      }).update({
        data:{
          status:"inactive",
          activationDate:"",
          firstBook:true,
          remainingBookCount:0,
          remainingDays:30,
          canceledWithinTwoHours:true
        }
      }).then(res=>{
        console.log("第一次取消预约时(2小时内)，月卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("第一次取消预约时(2小时内)，月卡更新状态失败",JSON.stringify(err,null,2))
      })
    }
  }else if(!firstBook && cardType=="月卡"){
    // 4.2 月卡非第一次取消约课(2小时外)
    if(!isWithinTwoHours){
      await monthlyCards.where({
        cardId:cardId
      }).update({
        data:{
          remainingBookCount:1
        }
      }).then(res=>{
        console.log("非第一次取消预约时(2小时外)，月卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("非第一次取消预约时(2小时外)，月卡更新状态失败",JSON.stringify(err,null,2))
      })
    }else{
      // 2小时内取消
      await monthlyCards.where({
        cardId:cardId
      }).update({
        data:{
          remainingBookCount:0,
          canceledWithinTwoHours:true
        }
      }).then(res=>{
        console.log("非第一次取消预约时(2小时内)，月卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("非第一次取消预约时(2小时内)，月卡更新状态失败",JSON.stringify(err,null,2))
      })
    }

  }

  // 5.修改weeklyCards信息（根据是否是第一次取消【还有课、没有课】）
  if(firstBook && cardType=="周卡"){
    // 5.1 周卡第一次取消约课【没有课】（变回add一张新卡的状态）
    if(weeklyCardTotalBookCount == totalBookCount+1){
      await weeklyCards.where({
        cardId:cardId
      }).update({
        data:{
          status:"inactive",
          activationDate:"",
          firstBook:true,
          remainingBookCount:2,
          totalBookCount:_.inc(1),
          remainingDays:7
        }
      }).then(res=>{
        console.log("第一次取消预约时【没有课】，周卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("第一次取消预约时【没有课】，周卡更新状态失败",JSON.stringify(err,null,2))
      })
    }else{
      // 5.2 周卡第一次取消约课【还有课】（依然保持active）
      await weeklyCards.where({
        cardId:cardId
      }).update({
        data:{
          firstBook:true,
          remainingBookCount:_.inc(1),
          totalBookCount:_.inc(1),
        }
      }).then(res=>{
        console.log("第一次取消预约时【还有课】，周卡更新状态成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("第一次取消预约时【还有课】，周卡更新状态失败",JSON.stringify(err,null,2))
      })
    }
  }else if(!firstBook && cardType=="周卡"){
    // 5.2 周卡非第一次取消约课，剩余次数自增
    await weeklyCards.where({
      cardId:cardId
    }).update({
      data:{
        remainingBookCount:_.inc(1),
        totalBookCount:_.inc(1),
      }
    }).then(res=>{
      console.log("非第一次取消预约时，周卡更新状态成功",JSON.stringify(res,null,2))
    }).catch(err=>{
      console.log("非第一次取消预约时，周卡更新状态失败",JSON.stringify(err,null,2))
    })
  }
}