class Lpf
{
  constructor(decay)
  {
    this.b = 1-decay;
    this.y1=0;
  }
  Cage(newValue)
  {
    this.y1 = newValue;
  }
  NextSample(x)
  {
    this.y1 += this.b*(x-this.y1);
    return this.y1;
  }
  SetDecay(decay)
  {
    this.b = 1-decay;
  }
  SetTauSamples(samples){
    this.SetDecay(Math.exp(-1/samples));
  }
};

class Hpf
{
  constructor(decay)
  {
    this.lpf=new Lpf(decay);
  }
  NextSample(x)
  {
    return x - this.lpf.NextSample(x);
  }
  SetDecay(decay){
    this.lpf.SetDecay(decay);
  }
  SetTauSamples(samples){
    this.SetDecay(Math.exp(-1/samples));
  }
};
