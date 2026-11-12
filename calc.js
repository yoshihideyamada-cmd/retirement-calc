(function(root){

var COEF_A=[1.22,1.44,1.63,1.81,2.05,3.26,4.36,5.53,6.71,7.83,8.96,10.12,11.31,12.54,13.81,15.53,17.28,19.06,20.81,22.52,23.58,
 24.63,25.71,26.77,27.82,30.00,31.00,32.00,33.00,34.00,35.00,36.00,37.00,38.00,39.00,39.80,39.85,39.90,39.95,40.00,40.05,40.10];
var COEF_B=[0,0,0,0,1.03,1.63,2.18,2.77,3.36,3.92,4.48,5.06,5.66,6.27,6.91,7.77,8.64,9.53,10.41,11.26,11.79,
 12.32,12.86,13.39,13.91,15.00,15.50,16.00,16.50,17.00,17.50,18.00,18.50,19.00,19.50,19.90,19.93,19.95,19.98,20.00,20.03,20.05];

var POINTS={shuji:10,sanji:50,san_yo:70};
var POINT_YEN=5000;

var REASONS={
 teinen:{column:'A',label:'定年退職'},
 shamei:{column:'A',label:'社命による他社転属'},
 shibo:{column:'A',label:'死亡'},
 gyomu:{column:'A',label:'業務上の事由による傷病退職(解雇)'},
 higyomu:{column:'B',label:'業務外の事由による傷病退職'},
 kaiko:{column:'B',label:'規定(退職金規則第2条)による解雇'},
 jiko:{column:'B',label:'自己都合退職'},
 chokai:{column:null,label:'懲戒解雇'}
};

function addMonths(d,n){
 var y=d.getFullYear(),m=d.getMonth()+n,day=d.getDate();
 var last=new Date(y,m+1,0).getDate();
 return new Date(y,m,Math.min(day,last));
}

function tenureMonths(hire,retire){
 var start=new Date(hire.getFullYear(),hire.getMonth(),hire.getDate());
 var end=new Date(retire.getFullYear(),retire.getMonth(),retire.getDate()+1);
 if(end<=start)return 0;
 var m=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
 if(end.getDate()<start.getDate())m--;
 if(m<0)m=0;
 if(end>addMonths(start,m))m++;
 return m;
}

function coefficient(table,months){
 var y=Math.floor(months/12),r=months%12;
 if(y<1)return 0;
 if(y>=table.length)return table[table.length-1];
 var c0=table[y-1],c1=table[y];
 return c0+(c1-c0)*r/12;
}

function ceil1000(x){
 return Math.ceil(Math.round(x*10000)/10000/1000)*1000;
}

function posYears(p){
 p=p||{};
 return (+p.y||0)+(+p.m||0)/12;
}

function calcRetirement(inp){
 var reason=REASONS[inp.reason];
 var months=tenureMonths(inp.hire,inp.retire);
 var out={
  months:months,
  years:Math.floor(months/12),
  remMonths:months%12,
  column:reason.column,
  reasonLabel:reason.label,
  coef:0,base:0,points:0,pointsAmount:0,kourou:inp.kourou,
  subtotal:0,total:0,
  payable:false,
  dueDate:new Date(inp.retire.getFullYear(),inp.retire.getMonth(),inp.retire.getDate()+14),
  notes:[]
 };

 if(months<12){
  out.notes.push('勤続1年未満のため退職金は支給されません(第1条)。');
  return out;
 }
 if(inp.reason==='chokai'){
  out.notes.push('懲戒解雇の場合は退職金は支給されません(第4条)。勤続10年以上の場合に限り、情状により一部が支給されることがあります(会社の判断・本ツールでは計算しません)。');
  return out;
 }
 if(inp.reason==='jiko'&&months<60){
  out.notes.push('自己都合退職で勤続5年未満のため退職金は支給されません(第2条)。');
  return out;
 }

 var table=reason.column==='A'?COEF_A:COEF_B;
 out.coef=coefficient(table,months);
 if(out.years>=table.length)out.notes.push('勤続'+table.length+'年超は、別表1の'+table.length+'年の係数を適用しています。');
 out.base=inp.honkyu*out.coef;

 if(reason.column==='A'){
  out.points=posYears(inp.pos.shuji)*POINTS.shuji+posYears(inp.pos.sanji)*POINTS.sanji+posYears(inp.pos.san_yo)*POINTS.san_yo;
  out.pointsAmount=out.points*POINT_YEN*inp.kourou;
 }else{
  out.notes.push('B欄適用のため、ポイント制度による加算はありません(第3条)。');
 }

 out.subtotal=out.base+out.pointsAmount;
 out.total=ceil1000(out.subtotal);
 out.payable=true;
 return out;
}

var api={COEF_A:COEF_A,COEF_B:COEF_B,REASONS:REASONS,POINTS:POINTS,POINT_YEN:POINT_YEN,tenureMonths:tenureMonths,coefficient:coefficient,ceil1000:ceil1000,calcRetirement:calcRetirement};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.Retirement=api;

})(this);
