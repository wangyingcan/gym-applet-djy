// 1. 此处填入云开发的envid、alias等信息(alias在首页需要使用)
const envList = [{"envId":"dev-3g5cl9ca65d64f4b","alias":"dev"},{"envId":"prod-5g2wkpjaadb1bf82","alias":"prod"}];
// 2. 修改此处的布尔值，用于判断部署云资源的脚本类型
const isMac = true;
// 3. 导出此JS文件定义的2个变量
module.exports = {
  envList,
  isMac
};
