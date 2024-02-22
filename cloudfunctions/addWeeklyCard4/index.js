// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.user表、weeklyCards表
const db = cloud.database();
const user = db.collection('user');
const weeklyCards = db.collection('weeklyCards');
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取openid、构造cardId
  const openid = cloud.getWXContext().OPENID;
  const cardId = openid + new Date().getTime();
  const randomStr=Math.random().toString(36).substr(2,8)
  const cardName="周卡"+randomStr
  console.log("cardName", cardName);
  // 2.weeklyCard新增一条未激活周卡记录
  try {
    let { _id } = await weeklyCards.add({
      data: {
        _openid: openid,
        cardId: cardId,
        purchaseDate: new Date().getFullYear() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getDate(),
        activationDate: "",
        status: "inactive",
        remainingDays: 7,
        cardName:cardName,
        cardType:"周卡",
        type:"一周四练",
        remainingBookCount:2,
        totalBookCount:4
      }
    })

    // 3.插入成功，更新user表
    if (_id) {
      console.log("插入周卡成功")
      await user.where({
        _openid: openid
      }).update({
        data: {
          weeklyCardIds: _.push(cardId)
        }
      }).then(res=>{
        console.log("user表插入周卡id成功")
      }).catch(err=>{
        console.log("user表插入周卡id失败")
      })
      return {
        addSuccess: true
      }
    } else {
      // 4.插入失败
      console.log("插入周卡失败");
      return {
        addSuccess: false
      }
    }
  } catch (err) {
    console.log("添加周卡操作失败");
    return {
      addSuccess: false
    }
  }
}
