// 返回当前年月日字符串
function getDate(){
  const now=new Date();
  return now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate();
}

module.exports={
  getDate
}