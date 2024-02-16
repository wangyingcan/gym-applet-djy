Page({
    data: {
        // 用户表，用于我的卡包个人基本信息的展示
        userInfo: {
            avatarUrl: 'cloud://dev-3g5cl9ca65d64f4b.6465-dev-3g5cl9ca65d64f4b-1324237307/1707967944569.png',//头像
            nickName: '登录 / 注册',//昵称
            monthlyCardIds: [],//个人月卡id集合
            weeklyCardIds: [],//个人周卡id集合
            expiredCardIds: [],//个人过期卡id集合
            bookedCourseNum: 0,//预约课程数
            thisMonthCourseRecordNum: 0,//本月课程记录数
            canceledClassNum: 0//取消课程数
        },
        // 课程表
        courseTable: {
            date: '2024.2.12',//日期
            index: 1,//星期
            courses: [   //日期对应课程列表
                {
                    startHour: 9,//开始时间
                    courseLength: 1,//课程时长
                    status: 1,//课程状态:1未预约、2已预约、3不在开放时间
                    courseName: '瑜伽',//课程名称
                    coachName: '张三',//教练
                    students: [],//学生,预约的学生openid
                }
            ]
        },

        // 待实现：学生已预约课程表：内部记录应该表示学生已预约的课程
        /*      1.从courseTable记录所在表中，先读取五天内的课程（开放时间的课程最多跨越5天，也可以单独按星期进行分支判断，在对应开放时间内进行检索）
                2.再筛选出status为2的课程
                3.最后筛选出students中包含用户openid的课程
        */

        // 待实现：学生取消课程记录表：内部记录应该表示学生已取消的课程
        /*      1.单独设计表结构，内部应该以openid为主键，将学生取消的课程记录写入（表结构已经和courseTable类似，但是需要做细微改动：取消courses.students，取消courses.status，_openid为主键）
                2.读写此表的时机：
                    学生点击取消课程按钮时，将取消的课程记录写入此表，同时将courseTable中对应课程的status改为1，并且计算记录总数，写入userInfo的canceledClassNum中（每次onShow刷新此值）
                    学生点击预约课程按钮时，先检查此表中是否有对应的取消记录，如果有，则将status改为2，并且将此条记录删除，同时计算记录总数，写入userInfo的canceledClassNum中（每次onShow刷新此值）
                    学生查看个人取消课程时，读取此表，进行展示
        */
        "canceledCourses": {
            "_openid": "user1", // 用户的 openid
            "canceledCourseRecords": [
                {
                    "date": "2024.2.12", // 取消的课程日期
                    "courseName": "瑜伽", // 取消的课程名称
                    "coachName": "张三", // 教练的名称
                    "startHour": 9, // 课程开始的时间（小时）
                    "courseLength": 1, // 课程的时长（小时）
                    "cancelTime": "2024.2.11 20:00" // 取消课程的时间
                },
                // 更多的取消课程记录...
            ]
        },
        // 更多的用户取消课程记录...


        // 待实现：学生本月上课记录表：内部记录应该表示学生本月上课的课程
        /*      1.单独设计表结构，内部应该以openid为主键，将学生上课的课程记录写入（表结构已经和courseTable类似，但是需要做细微改动：取消courses.students，取消courses.status，增加month字段，_openid为主键）
                2.读写此表的时机：
                    每小时产生了上完的课时（查询courseTable 时间+status判断）读取courses中元素students字段，利用openid将记录写入到此表；同时计算记录总数，写入userInfo的thisMonthCourseRecordNum中（每次onShow刷新此值）
                    学生查看个人本月上课记录时，读取此表，进行展示
        */
        "monthlyCourseRecords": {
            "_openid": "user1", // 用户的 openid
            "month": "2024.02", // 月份
            "courseRecords": [
                {
                    "date": "2024.2.12", // 上课的日期
                    "courseName": "瑜伽", // 课程名称
                    "coachName": "张三", // 教练的名称
                    "startHour": 9, // 课程开始的时间（小时）
                    "courseLength": 1, // 课程的时长（小时）
                    "attendedTime": "2024.2.12 10:00" // 上课的时间
                },
                // 更多的上课记录...
            ]
        },
        // 更多的用户上课记录...



        // 待实现：月卡表：内部记录应该表示每张已卖出月卡的信息
        /*      1.月卡规则：30天内有效，第一次利用此卡约课就开始计时，过期后自动转为过期卡；有效期间允许手动点击停卡一次，7天后自动恢复，停卡期间允许随时恢复，停卡状态不允许约课；如果30天内没停卡有效期自动增加2天
                2.读写此表的时机：
                    用户购买月卡时，将月卡记录写入此表，同时写入userInfo的monthlyCardIds中（每次onShow刷新此值）
                    每天22点（下班时间）检查此表，将使用中状态的月卡（剩余天数大于0）剩余天数减1
                    每天0点检查此表，将过期的月卡（剩余天数为0）转为过期状态的月卡；同时删除userInfo的monthlyCardIds中此openid删除，并写入userInfo的expiredCardIds中（每次onShow刷新此值）
        */

        "monthlyCards": {
            "_openid": "user1", // 用户的 openid
            "cardId": "card1", // 月卡的 id
            "purchaseDate": "2024.2.1", // 购买日期
            "activationDate": "2024.2.12", // 激活日期
            "expiryDate": "2024.3.14", // 过期日期
            "status": "active", // 卡的状态：active, paused, expired
            "remainingDays": 28, // 剩余天数
            "pauseStart": null, // 暂停开始的日期
            "pauseEnd": null, // 暂停结束的日期
            "hasPaused": false // 是否已经暂停过
        },
        // 更多的月卡记录...


        // 更多的用户上课记录...

        // 待实现：周卡表：内部记录应该表示每张已卖出周卡的信息
        /*      1.周卡规则：7天内有效，第一次利用此卡约课就开始计时，过期后自动转为过期卡
                2.读写此表的时机：
                    用户购买周卡时，将周卡记录写入此表，同时写入userInfo的weeklyCardIds中（每次onShow刷新此值）
                    每天22点（下班时间）检查此表，将使用中状态的周卡（剩余天数大于0）剩余天数减1
                    每天0点检查此表，将过期的周卡（剩余天数为0）转为过期状态的周卡；同时删除userInfo的weeklyCardIds中此openid删除，并写入userInfo的expiredCardIds中（每次onShow刷新此值）
        */
        "weeklyCards": {
            "_openid": "user1", // 用户的 openid
            "cardId": "card1", // 周卡的 id
            "purchaseDate": "2024.2.1", // 购买日期
            "activationDate": "2024.2.12", // 激活日期
            "expiryDate": "2024.2.19", // 过期日期
            "status": "active", // 卡的状态：active, expired
            "remainingDays": 6 // 剩余天数
        },
        // 更多的周卡记录...

    }

})