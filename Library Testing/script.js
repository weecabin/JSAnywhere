$(function() {
  console.log('Library Testing');
});

debugMode=true;

function Setup()
{
  try
  {
    TestVector();
    //TestAverageData();
    //AddStatus();
    //TableTest();
    //AddStatus();
    //TestNormalizeData();
  }
  catch(err)
  {
    console.log(err)
  }
}

function TestVector()
{
  let p3=new Vector(-50,28);
  AddStatus("new Vector(-50,-28) dir = "+p3.GetDirection());
  let p1=new Vector(8,4);
  let p2=new Vector(4,7);
  let proj=p2.ProjectOn(p1);
  AddStatus("p2Project on p1="+JSON.stringify(proj));
  let v1=new Vector(1,0); 
  let v2=new Vector(2,0);
  let v1n = v1.UnitNormal();
  let v1u = v1.Unit();
  AddStatus("v1="+JSON.stringify(v1));
  AddStatus("v2="+JSON.stringify(v2));
  AddStatus("v1.Normal()="+JSON.stringify(v1n));
  AddStatus("v1.Unit()="+JSON.stringify(v1u));
  AddStatus("\n\n\nRotate v2 then print its heading \nand the difference between it and v1");
  for (let dir=0;dir<720;dir=dir+45)
  {
    AddStatus("\nv2 Direction="+dir);
    v2.SetDirection(dir);
    let v2unit = v2.Unit();
    let v2norm = v2.UnitNormal();
    let v1projv2 = v1.ProjectOn(v2);
    AddStatus("v2= "+JSON.stringify(v2));
    AddStatus("v1 projected on v2\n"+JSON.stringify(v1projv2));
    AddStatus("v1projv2 direction = "+v1projv2.GetDirection());
    AddStatus("v2unit= "+JSON.stringify(v2unit));
    AddStatus("v2norm= "+JSON.stringify(v2norm));
    AddStatus("angle between v2unit and v2norm="+v2unit.AngleBetween(v2norm));
    AddStatus("v1.GetDirection()="+v1.GetDirection()); 
    AddStatus("v2.GetDirection()="+v2.GetDirection());
    AddStatus("v1.AngleBetween(v2)="+v1.AngleBetween(v2));
  }
  AddStatus("now test vector.RotateMe(degrees) and vector.Rotate(degrees), start with");
  AddStatus(JSON.stringify(v1));
  for (let i=1;i<36;i++)
  {
    AddStatus("v1.Rotate(10)="+JSON.stringify(v1.Rotate(10)));
    v1.RotateMe(10);
    AddStatus("v1.RotateMe(10)="+JSON.stringify(v1));
  }
  AddStatus("Exiting TestVector");
}

function TestNormalizeData()
{
  try
  {
    AddStatus("Entering TestNormalizeData");
    let data=[[-50,-50],[200,-50],[200,50],[-50,50],[-50,-50]];
    AddStatus(JSON.stringify(data));
    let normdata=NormalizeData(data);
    AddStatus("Normalized="+JSON.stringify(normdata));
    AddStatus("Exiting TestNormalizeData");
  }
  catch(err)
  {
    AddStatus(err);
  }
}

function TestAverageData()
{
  AddStatus("Entering TestAverageData");
  let data = [[1,10,100],[2,20,200],[2.5,25,250],[3,30,300]];
  AddStatus(JSON.stringify(data));
  AddStatus(JSON.stringify(AverageData(data)));
  AddStatus("Exiting TestAverageData");
}

function TableTest()
{
  try
  {
    AddStatus("Entering TableTest");
    let headings=["label","d1","d2","d3"];
    let data = [[1,10,100],[2,20,200],[2.5,25,250],[3,30,300]];
    let datalabels=["Set1","Set2","Set3","Set4"];
    let tbl=new MyTable(headings);
    let i = 0;
    for (let d of data)
    {
      tbl.AddRow([datalabels[i++],d[0],d[1],d[2]]);
    }
    let stats=AverageData(data);
    AddStatus(JSON.stringify(stats));
    tbl.AddRow(["Minimum",stats.min[0],stats.min[1],stats.min[2]]);
    tbl.AddRow(["Maximum",stats.max[0],stats.max[1],stats.max[2]]);
    tbl.AddRow(["Average",stats.avg[0],stats.avg[1],stats.avg[2]]);
    AddStatus(tbl.GetHTML());
    get("tabletest").innerHTML=tbl.GetHTML()
    AddStatus("Exiting TableTest");
  }
  catch(err)
  {
    AddStatus(err);
  }
}
