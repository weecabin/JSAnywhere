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
  let v1=new Vector(1,0); 
  let v2=new Vector(1,0);
  AddStatus("v1="+JSON.stringify(v1));
  AddStatus("v2="+JSON.stringify(v2));
  AddStatus("Rotate v2 then print its heading \nand the difference between it and v1");
  for (let dir=0;dir<720;dir=dir+45)
  {
    AddStatus("\nv2 Direction="+dir);
    v2.SetDirection(dir);
    AddStatus("v2= "+JSON.stringify(v2));
    AddStatus("v2.GetDirection()="+v2.GetDirection());
    AddStatus("v1.AngleBetween(v2)="+v1.AngleBetween(v2));
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
