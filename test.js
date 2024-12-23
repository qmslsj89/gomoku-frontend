#include<reg52.h>
#include<intrins.h>
 
typedef unsigned char uchar;
typedef unsigned int  uint;
 
sbit Tr=P1^0;//触发信号
sbit Ec=P1^1;//回响信号
 
 
void Delay10us(void);//10us延时函数
void Delay1ms(void);//1ms延时函数
uint Read_value(void);//读值函数
void InitTimer0(void);//定时器0初始化
void show(uint Out);//显示函数
 
void main()
{
    uint distance;
    Tr=0;//出发引脚首先拉低
    InitTimer0();//初始化定时器0
    distance=Read_value();//读值
    show(distance);//显示距离
}
 
 
/********************读值函数***********************/
uint Read_value()
{
    float temp;
    uint result;
    Tr=1;//触发引脚发出11us的触发信号（至少10us）
    Delay10us();
    _nop_();
    Tr=0;
    while(!Ec);//度过回响信号的低电平
    TR0=1;//开启定时器0
    while(Ec);//度过回响信号高电平
    TR0=0;//关闭定时器0
    temp=TH0*256+TL0;//最终us时间
    temp/=1000.0;//最终ms时间
    temp*=17.0;//距离(cm) (17=光速34cm/ms 除2)
    result=temp;//四舍五入
    if(temp-result>=0.5)
    {
        result+=1;
    }
    return result;
 
            
}
/***********************10us延时函数*****************************/
void Delay10us()
{
    uchar i;
    i=2;
    while(--i);
          
}
/***********************1ms延时函数*****************************/
void Delay1ms()   //误差 0us
{
    unsigned char a,b,c;
    for(c=1;c>0;c--)
        for(b=142;b>0;b--)
            for(a=2;a>0;a--);
}
/************************定时器0初始化*****************************/
void InitTimer0(void)
{
    TMOD = 0x01;
    TH0 = 0x00;
    TL0 = 0x00;
    TR0 = 0;//先关闭定时器0
}
 
 
/**********************显示函数*************************************/
void Show(uint Out)
{
    char duan[10]={0xc0,0xf9,0xa4,0xb0,0x99,0x92,0x82,0xf8,0x80,0x90};//段码
    while(1)
    {
        P2=0x01;//第四位（个位）
        Delay10us();
        P3=duan[Out%10];
        Delay1ms();
        P3=0xff;
 
 
        P2=0x02;//第三位（十位）
        Delay10us();
        P3=duan[(Out/10)%10];
        Delay1ms();
        P3=0xff;
 
        P2=0x04;//第二位（百位）
        Delay10us();
        P3=duan[(Out/100)%10];
        Delay1ms();
        P3=0xff;
 
        P2=0x08;//第一位（千位）
        Delay10us();
        P3=duan[(Out/1000)%10];
        Delay1ms();
        P3=0xff;
    }
}//需要在通过p0.0 按住时进行测距  并且超声波模块sbit Tr = P1^0; // 触发信号sbit Ec = P1^1; // 回响信号   数值发生改变的时候 实时在屏幕上显示对应的数值 松开p0.0后屏幕记录最后的数值  通过p0.1可以将屏幕的数值清零

可以换个方法实现我的想要的功能