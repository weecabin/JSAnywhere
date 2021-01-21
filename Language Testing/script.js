
function SetupLanguageTesting()
{
  DefaultFnParams();
  AddStatus();
  TestObjectArrays();
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