// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.user表、monthlyCards表
const db = cloud.database();
const user = db.collection('user');
const monthlyCards = db.collection('monthlyCards');
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取openid、构造cardId
  const openid = cloud.getWXContext().OPENID;
  const cardId = openid + new Date().getTime()
  // 随机生成8位数字、字母组成的字符串（小数、36进制、截取字符串）
  let randomStr = Math.random().toString(36).substr(2, 8);
  const cardName="月卡"+randomStr
  console.log("cardName", cardName);
  // 2.monthlyCard新增一条未激活月卡记录
  try {
    let { _id } = await monthlyCards.add({
      data: {
        _openid: openid,
        cardId: cardId,
        purchaseDate: new Date().getFullYear() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getDate(),
        activationDate: "",
        status: "inactive",
        remainingDays: 30,
        pauseStart: "",
        pauseEnd: "",
        hasPaused: false,
        cardName:cardName,
        remainingBookCount:1,
        cardType:"月卡",
        firstBook:true,
        canceledWithinTwoHours:false
      }
    })

    // 3.插入成功，更新user表
    if (_id) {
      let updateResult = await user.where({
        _openid: openid
      }).update({
        data: {
          monthlyCardIds: _.push(cardId)
        }
      })
      console.log("更新成功", JSON.stringify(updateResult));
      return {
        addSuccess: true
      }
    } else {
      // 4.插入失败
      console.log("插入失败");
      return {
        addSuccess: false
      }
    }
  } catch (err) {
    console.log("操作失败", JSON.stringify(err));
    return {
      addSuccess: false
    }
  }
}
