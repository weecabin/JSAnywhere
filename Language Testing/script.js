
function SetupLanguageTesting()
{
  TestMovingVector()
  TestVectorMath();
  //TestHTMLTableWithLookup();
  //DefaultFnParams();
  //AddStatus();
  //TestObjectArrays();
}

/**********************************************
***********************************************
               Moving Vector
***********************************************
**********************************************/


function TestMovingVector()
{
  let mv = new MovingVector(1,-1,200,200);
  AddStatus(JSON.stringify(mv));
  mv.Move(10);
  AddStatus(JSON.stringify(mv));
  mv.vector.RotateMe(90);
  mv.Move(10);
  AddStatus(JSON.stringify(mv));
}

/**********************************************
***********************************************
               Vector Math
***********************************************
**********************************************/


function TestVectorMath()
{
  let v1 = new Vector(1,1);
  let v2 = new Vector(2,3);
  let v3 = new Vector(5,0);
  let v4 = new Vector(Math.sqrt(2),45,false);
  AddStatus("v1,v2,v3,v4 = "+
    JSON.stringify(v1)+","+
    JSON.stringify(v2)+
    JSON.stringify(v3)+
    JSON.stringify(v4)
    );
  let v1plusv2 = v1.Add(v2);
  AddStatus("v1+v2 = "+JSON.stringify(v1plusv2));
  let v2unit=v2.Unit();
  AddStatus("v2 Unit Vector/Length = "+JSON.stringify(v2unit)+" / "+v2unit.GetLength());
  let v1dotv2=v1.Dot(v2);
  AddStatus("v1 dot v2 ="+v1dotv2);
  AddStatus("angle between v1 v2="+v1.AngleBetween(v2)+"deg");
  AddStatus("angle between v1 v3="+v1.AngleBetween(v3)+"deg");
  AddStatus("angle between v1 v4="+v1.AngleBetween(v4)+"deg");
  AddStatus("are equal v1 v4="+(v1.IsEqual(v1,v4)?"yes":"no"));
  AddStatus("v1 Normal vector="+JSON.stringify(v1.Normal()));
  v1.RotateMe(-45);
  AddStatus("v1 rotated -45 = "+JSON.stringify(v1));
  v1.RotateMe(45);
  v1.SetLength(2);
  AddStatus("v1 rotated 45 with length 2 = "+JSON.stringify(v1));
}


/**********************************************
***********************************************
       Object Arrays and HTML tables
***********************************************
**********************************************/
let lookuptable=
[
  {id:"KSAN",lat:32,lon:-117,junk:[[2],[3]]},
  {id:"KPSP",lat:32,lon:-116,junk:[[5],[7],[8]]},
  {id:"KLAX",lat:33,lon:-117,junk:[[1],[2]]}
];
function TestHTMLTableWithLookup()
{
  // create the table
  AddStatus("\nEntering TestHTMLTableWithLookup");
  // these are the table headings
  let tbl = new MyTable(["Action","Fix Name","latitude","longitude"]);
  // now add the rows
  for (let wp of lookuptable)
  {
    // here's the good stuff, we want to create a button
    // with an onclick="GetRow('idtext')" parameter, where idtext 
    // is the id of an entry in the lookup table corresponding
    // to this row.
    let button="<input type=\"button\" value=\"Get\" onclick=\"GetRow(\'"+wp.id+"\')\">"
    tbl.AddRow([button,wp.id,wp.lat,wp.lon]);
  }
  // insert the table in the div
  get("tablediv").innerHTML=tbl.GetHTML();
}

// this is the function called in the button onclick event.
// selectid contains the id of the row in the table that built the row 
// in the HTML table.
function GetRow(selectedid)
{
  AddStatus("Entering GetRow with id="+selectedid);
  //now print out the entire content of the "id" row of the lookup table
  let row=lookuptable.filter(x=>x.id==selectedid)[0];
  AddStatus(
    "id="+row.id+
    ",lat="+row.lat+
    ",lon="+row.lon+
    ",junk="+row.junk);
}

/**********************************************
***********************************************
       Object Arrays used as lookup tables
***********************************************
**********************************************/
function TestObjectArrays()
{
  let lookuptable=
  [
  {id:"KSAN",lat:32,lon:-117,junk:[[2],[3]]},
  {id:"KLAX",lat:33,lon:-117,junk:[[1],[2]]}
  ];
  AddStatus("Lookup table\n"+JSON.stringify(lookuptable));
  let ksan=lookuptable.filter(x=>x.id=="KSAN");
  //print out the entire found object
  AddStatus("found object...");
  AddStatus("KSAN = "+JSON.stringify(ksan[0]));
  //print out the individual pieces
  AddStatus("using individual pieces...");
  AddStatus("id="+ksan[0].id+" latitude="+ksan[0].lat+
            " longitude="+ksan[0].lon+" junk="+ksan[0].junk);
}
/**********************************************
***********************************************
       Default function Parameters
***********************************************
**********************************************/

function DefaultFnParams()
{
  fnWithDefaultParams("p1specified");
  fnWithDefaultParams("p1specified",undefined,"p3specified");
  fnWithDefaultParams("p1specified"," p2specified");
}

function fnWithDefaultParams(p1,p2=" p2default ",p3=" p3default ")
{
  AddStatus(p1+p2+p3);
}

function AddStatus(str)
{
  if (str==undefined)str="";
  stat=document.getElementById("status");
  stat.value+="\n"+str;
}