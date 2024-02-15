// 1.云函数入口文件
const cloud = require('wx-server-sdk')

// 2.使用当前云环境，完成环境初始化
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })  // 和cloudFunctions右键选择的环境一致

// 3.云函数入口函数（event是小程序端请求传入管理端的参数）
exports.main = async (event) => {
  // 3.1利用wx.getWXContext()直接获取到用户OPENID
  const {OPENID} = cloud.getWXContext();

  // 3.2获取用户表
  const db=cloud.database();
  const userInfo=db.collection('user');

  // 3.3利用OPENID查询用户表
  const {data} =await userInfo.where({
    _openid:OPENID
  }).get();

  // 3.4无数据则插入数据，注册逻辑
  if(data.length===0){
    // 3.4.1 插入数据，返回新纪录的_id
    const {_id} =await userInfo.add({
      data:{
        _openid:OPENID,
        nickName:event.nickName,
        avatarUrl:event.avatarUrl,
        monthlyCardIds:[],
        weeklyCardIds:[],
        expiredCardIds:[],
        bookedCourseNum:0,
        thisMonthCourseRecordNum:0,
        canceledClassNum:0
      }
    })

    // 3.4.2 根据_id查询用户表，返回数据
    const user =await userInfo.doc(_id).get();
    return {
      data:user.data
    }
  }else{
    // 3.5有数据则直接返回数据，登录逻辑
    return {
      data:data[0]
    } 
  }
}