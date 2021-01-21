

function SetupLanguageTesting()
{
  DefaultFnParams();
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
  stat=document.getElementById("status");
  stat.value+="\n"+str;
}