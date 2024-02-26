// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取couponNewUser表
const db = cloud.database();
const coupon = db.collection('couponNewUser');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取参数
  const openid = cloud.getWXContext().OPENID;
  let now = new Date();
  let couponUseTime = now.getFullYear()+"."+(now.getMonth()+1)+"."+now.getDate();    // 初始化返回值
  let updateCouponUsed = false;    // 初始化返回值

  // 2.查询并更新couponNewUser表，包括isUsed、couponUseTime
  await coupon.where({
    _openid: openid
  }).update({
    data:{
      isUsed: true,
      couponUseTime: couponUseTime
    }
  }).then(res=>{
    console.log("更新成功",JSON.stringify(res,null,2))
    updateCouponUsed = true;
  }).catch(err=>{
    console.log("更新失败",JSON.stringify(err,null,2))
    updateCouponUsed = false;
  });

  // 3.返回结果
  return {
    updateCouponUsed: updateCouponUsed
  }

}