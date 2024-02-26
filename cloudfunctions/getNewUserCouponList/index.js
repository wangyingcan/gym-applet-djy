// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db=cloud.database();
const couponNewUser = db.collection('couponNewUser');

// 云函数入口函数
exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID
  let newUserCouponList=[];

  // 1.查询数据库
  let res = await couponNewUser.where({
    _openid:openid
  }).get();

  // 2.判断是否查询到数据
  if(res.data.length>0){
    newUserCouponList=res.data;
    console.log('newUserCouponList:',newUserCouponList);
    return {
      newUserCouponList: newUserCouponList
    }
  }else{
    return {
      newUserCouponList: newUserCouponList
    }
  }
}