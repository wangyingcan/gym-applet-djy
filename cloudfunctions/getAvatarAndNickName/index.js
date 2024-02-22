// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.读取user表
const db=cloud.database();
const user=db.collection('user');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取用户的openid
  const openid = cloud.getWXContext().OPENID;

  // 2.查询user，获取avatarUrl、nickName
  try {
    let res = await user.where({
      _openid: openid
    }).field({
      avatarUrl: true,
      nickName: true
    }).get();
  
    console.log("查询成功", res);
    return {
      avatarUrl: res.data[0].avatarUrl,
      nickName: res.data[0].nickName,
      openid
    }
  } catch (err) {
    console.log("查询失败", err);
  }
}