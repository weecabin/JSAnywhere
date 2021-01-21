function DistHeadingDxDy(latfrom,lonfrom,latto,lonto)
{
   var lonMult = LonMultiplier((latfrom+latto)/2);
   var dy = (latto-latfrom)*60;
   var dx = ((lonto-lonfrom) / lonMult)* 60;
   var dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
   if (dx==0)
      dx = .000001;

   AddStatus("latfrom,latto,dlat,dy="+latfrom.toFixed(5)+","+latto.toFixed(5)+
","+(latto-latfrom).toFixed(5)+","+dy.toFixed(5)); 
   AddStatus("lonfrom,lonto,dlat,dx="+lonfrom.toFixed(5)+","+lonto.toFixed(5)+
","+(lonto-lonfrom).toFixed(5)+","+dx.toFixed(5)); 

   var dyx=dy/dx;
   var angleRadians = Math.atan(dyx);
   var angleDegrees = angleRadians*180/Math.PI;
   var heading = FixHeading(90-angleDegrees); 
   if (dx<0)
      heading = 270-angleDegrees;
   return[dist,heading,dx,dy];
}

// returns a longitude scaling factor for the given latitude. 
function LonMultiplier(latitude)
{
  return 1/Math.sin((90-latitude)*Math.PI*2/360);
}

// small headings around 0 are returned as 0
// headings larger than 360 are reduced to a value less than 360
// negative headings are converted to a positive number
function FixHeading(fixthis)
{
  var h = fixthis;
  if (Math.abs(h) < .1) 
    return 0;
  if ((Math.abs(h) / 360) >= 1)
    h = h % 360;
  if (h < 0)
  {
    return 360 + h;
  } 
  return h;
}
