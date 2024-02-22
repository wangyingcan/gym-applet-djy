// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.获取user表、monthlyCards、weeklyCards表
const db = cloud.database();
const user = db.collection('user');
const monthlyCards = db.collection('monthlyCards');
const weeklyCards = db.collection('weeklyCards');

// 云函数入口函数（传入待激活卡的cardId）
exports.main = async (event, context) => {
  // 1.初始化参数
  const cardId = event.cardId;
  const openid = cloud.getWXContext().OPENID;
  const now = new Date();
  const activationDate = now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate();
  console.log(cardId)

  // 2.通过user判断是周卡还是月卡
  let res = await user.where({
    _openid: openid
  }).field({
    monthlyCardIds: true,
    weeklyCardIds: true
  }).get();

  if(res.data.length>0){
    // 2.1获取monthlyCardIds、weeklyCardIds
    let monthlyCardIds = res.data[0].monthlyCardIds;
    let weeklyCardIds = res.data[0].weeklyCardIds;

    // 2.2判断是周卡还是月卡
    if(monthlyCardIds.includes(cardId)){
      // 2.2.1激活月卡
      await monthlyCards.where({
        cardId:cardId
      }).update({
        data:{
          status:"active",
          activationDate:activationDate
        }
      }).then(res=>{
        console.log("激活月卡成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("激活月卡失败",JSON.stringify(err,null,2))
      });
    }else if(weeklyCardIds.includes(cardId)){
      // 2.2.2激活周卡
      // 计算剩余天数（开卡那天距离下周一0点的时间）
      let remainingDays= 0 ;
      let day = now.getDay();  //今天星期几
      if(day == 0){   //星期天激活周卡
        remainingDays = 1;
      }else{
        remainingDays = 8 - day;
      }
      await weeklyCards.where({
        cardId:cardId
      }).update({
        data:{
          status:"active",
          activationDate:activationDate,
          remainingDays
        }
      }).then(res=>{
        console.log("激活周卡成功",JSON.stringify(res,null,2))
      }).catch(err=>{
        console.log("激活周卡失败",JSON.stringify(err,null,2))
      });
    }
  }
}