// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数（判断是新用户还是注册用户）
exports.main = async (event, context) => {
  // 1.获取当前用户的openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  // 2.查询用户表
  const db = cloud.database()
  const userInfo = db.collection('user')
  const {data} =await userInfo.where({
    _openid:openid
  }).get()
  // 3.判断是否存在用户
  if(data.length===0){
    // 4.未注册，返回其openid和新用户标识
    return {
      openid,
      isNewUser:true
    }
  }else{
    // 5.已注册，返回其openid和新用户标识
    return {
      openid,
      isNewUser:false
    }
  }
}