// 0.引入数据库
const db =wx.cloud.database();
// 1.获取集合
const courseTable =db.collection('CourseTable');


Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  // 向集合中批量插入数据
  insertCourses(){
    courseTable.add({
      data:{
        "date": "2024-2-12",
        "index": 1,
        "courses": [
          {
            "startHour": 9,
            "courseLength": 1,
            "status": 3,
            "courseName": "瑜伽",
            "coachName": "张三",
            "students": []
          },
          {
            "startHour": 10,
            "courseLength": 2,
            "status": 3,
            "courseName": "瑜伽",
            "coachName": "张三",
            "students": []
          }
        ],
      }
    }).then(res=>{
      console.log('插入成功',res)
    }).catch(err=>{
     console.log('插入失败',err)
    })
  }


})