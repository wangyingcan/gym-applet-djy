// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境


// 0.准备数据库
const db = cloud.database();
const monthlyCards = db.collection('monthlyCards');
const weeklyCards = db.collection('weeklyCards');
const expiredCards = db.collection('expiredCards');
const user = db.collection('user');
const _ = db.command;

/**
 * 函数作用：0点更新
 * 读表对象：月卡表、周卡表
 * 写表对象：月卡表、周卡表、过期卡表、用户表
 * 更新规则：
 *        1.对于active的月卡、周卡，将remainingDays减1，并将remainingDays为0的status修改成expired
 *        2.对于expired的月卡、周卡，删除用户表中monthlyCardIds、weeklyCardIds中的对应id，并在expiredCards中插入一条新记录，最后将expiredCards新纪录的cardId插入到user表的expiredCardIds中
 *        3.对于paused的月卡，pauseStart和今天的日期有无7天之久，有则修改status为active、pauseEnd
 */
exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID;

  // 1.1月卡表修改remainingDays
  await monthlyCards.where({
    status: "active"
  }).update({
    data: {
      remainingDays: _.inc(-1)
    }
  }).then(res => {
    console.log("1.1月卡remainingDays减1成功")
  }).catch(err => {
    console.log("1.1月卡remainingDays减1失败")
  });

  // 1.2月卡表修改status（没停过卡会续2天、停卡了就不续）
  await monthlyCards.where({
    status: "active",
    remainingDays: 0,
    hasPaused: true
  }).update({
    data: {
      status: "expired"
    }
  }).then(res => {
    console.log("1.2月卡status修改成功")
  }).catch(err => {
    console.log("1.2月卡status修改失败")
  });

  await monthlyCards.where({
    status: "active",
    remainingDays: 0,
    hasPaused: false
  }).update({
    data: {
      remainingDays: _.inc(2),
      hasPaused: true
    }
  }).then(res => {
    console.log("1.2月卡remainingDays加2成功")
  }).catch(err => {
    console.log("1.2月卡remainingDays加2失败")
  });

  // 1.3周卡表修改remainingDays
  await weeklyCards.where({
    status: "active"
  }).update({
    data: {
      remainingDays: _.inc(-1)
    }
  }).then(res => {
    console.log("1.3周卡remainingDays减1成功")
  }).catch(err => {
    console.log("1.3周卡remainingDays减1失败")
  });

  // 1.4周卡表修改status
  await weeklyCards.where({
    status: "active",
    remainingDays: 0
  }).update({
    data: {
      status: "expired"
    }
  }).then(res => {
    console.log("1.4周卡status修改成功")
  }).catch(err => {
    console.log("1.4周卡status修改失败")
  });

  // 2.1查询expired的月卡
  try {
    let res = await monthlyCards.where({
      status: "expired"
    }).get();
    console.log("2.1查询expired月卡成功");

    // 2.2对查到的expired卡进行处理
    for (let card of res.data) {
      // 2.2.1删除用户表中的monthlyCardIds
      await user.where({
        _openid: openid
      }).update({
        data: {
          monthlyCardIds: _.pull(card.cardId)
        }
      }).then(res => {
        console.log("2.2.1删除用户表中的monthlyCardIds成功")
      }).catch(err => {
        console.log("2.2.1删除用户表中的monthlyCardIds失败")
      });

      const expiresCardId = openid + new Date().getTime();

      // 2.2.2插入一条新记录到expiredCards
      await expiredCards.add({
        data: {
          _openid: openid,
          cardId: expiresCardId,
          type: "月卡",
          expiredDate: new Date().getFullYear() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getDate(),
          purchaseDate: card.purchaseDate,
          activationDate: card.activationDate,
          pauseStart: card.pauseStart,
          pauseEnd: card.pauseEnd,
          hasPaused: card.hasPaused
        }
      }).then(res => {
        console.log("2.2.2插入一条新记录到expiredCards成功")
      }).catch(err => {
        console.log("2.2.2插入一条新记录到expiredCards失败")
      });

      // 2.2.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中
      await user.where({
        _openid: openid
      }).update({
        data: {
          expiredCardIds: _.push(expiresCardId)
        }
      }).then(res => {
        console.log("2.2.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中成功")
      }).catch(err => {
        console.log("2.2.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中失败")
      });
    }
  } catch (err) {
    console.log("2.1查询expired月卡失败");
  }

  // 2.3查询expired的周卡
  try {
    let res = await weeklyCards.where({
      status: "expired"
    }).get();
    console.log("2.3查询expired周卡成功");

    // 2.4对查到的expired卡进行处理
    for (let card of res.data) {
      // 2.4.1删除用户表中的weeklyCardIds
      await user.where({
        _openid: openid
      }).update({
        data: {
          weeklyCardIds: _.pull(card.cardId)
        }
      }).then(res => {
        console.log("2.4.1删除用户表中的weeklyCardIds成功")
      }).catch(err => {
        console.log("2.4.1删除用户表中的weeklyCardIds失败")
      });

      const expiredCardId=openid + new Date().getTime();

      // 2.4.2插入一条新记录到expiredCards
      await expiredCards.add({
        data: {
          _openid: openid,
          cardId: expiredCardId,
          type: "周卡",
          expiredDate: new Date().getFullYear() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getDate(),
          purchaseDate: card.purchaseDate,
          activationDate: card.activationDate
        }
      }).then(res => {
        console.log("2.4.2插入一条新记录到expiredCards成功")
      }).catch(err => {
        console.log("2.4.2插入一条新记录到expiredCards失败")
      });

      // 2.4.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中
      await user.where({
        _openid: openid
      }).update({
        data: {
          expiredCardIds: _.push(expiredCardId)
        }
      }).then(res => {
        console.log("2.4.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中成功")
      }).catch(err => {
        console.log("2.4.3将expiredCards新纪录的cardId插入到user表的expiredCardIds中失败")
      });
    }
  } catch (err) {
    console.log("2.3查询expired周卡失败");
  }

  // 3.1查询paused状态的月卡
  try {
    let res = await monthlyCards.where({
      status: "paused"
    }).get();
    console.log("3.1查询paused状态的月卡成功")

    // 3.2遍历处理
    for (let card of res.data) {
      // 3.2.1计算pauseStart和今天的日期有无7天之久
      const pauseStartYear = card.pauseStart.split('.')[0];
      const pauseStartMonth = card.pauseStart.split('.')[1];
      const pauseStartDate = card.pauseStart.split('.')[2];
      let pauseStart = new Date(pauseStartYear, pauseStartMonth - 1, pauseStartDate, 0, 0, 0);
      let now = new Date();
      let diff = now.getTime() - pauseStart.getTime();
      if (diff >= 1000 * 60 * 60 * 24 * 7) {
        // 3.2.2修改status为active、pauseEnd
        await monthlyCards.where({
          cardId: card.cardId
        }).update({
          data: {
            status: "active",
            pauseEnd: now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate()
          }
        }).then(res => {
          console.log("3.2.2修改status为active、pauseEnd成功")
        }).catch(err => {
          console.log("3.2.2修改status为active、pauseEnd失败")
        });
      }
    }
  } catch (err) {
    console.log("3.1查询paused状态的月卡失败")
  }

}