var c = E.compiledC(`
    // void onHRM(int,int)
    // int getTick()

      volatile unsigned int hr;
      volatile unsigned int tick;
      volatile short rollingAvg = 0;
      volatile short minGrad = 32767;
      volatile short maxGrad = -32768;
      volatile short minDeri = 32767;
      volatile short maxDeri = -32768;

      volatile const unsigned char windowSize = 64;
      volatile const unsigned char rollLen = 1;
      volatile const float oderi = 0.025;
      volatile const float ograd = 0.15;

      typedef struct inputs {
        short * amps;
        short * deris;
        short * grads;
        short * avgs;
        short * parts;
      } inputs_t;

      void onHRM(int amp,void *argss){
        inputs_t* args = argss;
        args->amps[tick % windowSize] = amp;

        rollingAvg = rollingAvg + amp;
        if ( tick >= rollLen ) {
          rollingAvg = rollingAvg - args->amps[(tick-rollLen) % windowSize];
        }
        args->avgs[tick % windowSize] = rollingAvg/rollLen;
        if ( tick > 3 ) {
          unsigned int cc = tick-2;
          short * use = args->amps; //use avg?
          short deriV = use[(cc-1) % windowSize] - 2 * use[cc % windowSize] + use[(cc+1) % windowSize];
        //short deriV = use[(cc-2) % windowSize] - 4 * use[(cc-1) % windowSize] + 6 * use[cc % windowSize] - 4 * use[(cc+1) % windowSize] + use[(cc+2) % windowSize];
          short gradV = (use[(tick) % windowSize] - use[(tick-2) % windowSize])>>1;
        //gradV = (gradV < 0) ? -gradV : gradV;
          args->grads[tick % windowSize] = gradV;
          args->deris[tick % windowSize] = deriV;

          args->parts[tick % windowSize] = 0;
          const short wdw = 32;
          if ( tick >= wdw ) {
            if ( minGrad == args->grads[(tick-wdw) % windowSize] )
            {
              minGrad = 32767; //recalculate min
              for ( int i = 0; i < wdw; i++ ) {
                if ( args->grads[(tick-i) % windowSize] < minGrad )
                  minGrad = args->grads[(tick-i) % windowSize];
              }
            } else {
              if ( gradV < minGrad ) minGrad = gradV;
            }
            if ( minDeri == args->deris[(tick-wdw) % windowSize] )
            {
              minDeri = 32767; //recalculate min
              for ( int i = 0; i < wdw; i++ ) {
                if ( args->deris[(tick-i) % windowSize] < minDeri )
                  minDeri = args->deris[(tick-i) % windowSize];
              }
            } else {
              if ( deriV < minDeri ) minDeri = deriV;
            }
            if ( maxGrad == args->grads[(tick-wdw) % windowSize] )
            {
              maxGrad = -32768; //recalculate max
              for ( int i = 0; i < wdw; i++ ) {
                if ( args->grads[(tick-i) % windowSize] > maxGrad )
                  maxGrad = args->grads[(tick-i) % windowSize];
              }
            } else {
              if ( gradV > maxGrad ) maxGrad = gradV;
            }
            if ( maxDeri == args->deris[(tick-wdw) % windowSize] )
            {
              maxDeri = -32768; //recalculate min
              for ( int i = 0; i < wdw; i++ ) {
                if ( args->deris[(tick-i) % windowSize] > maxDeri )
                  maxDeri = args->deris[(tick-i) % windowSize];
              }
            } else {
              if ( deriV > maxDeri ) maxDeri = deriV;
            }
            short rangeGrad = maxGrad - minGrad;
            short rangeDeri = maxDeri - minDeri;
          //gradV < minGrad+rangeGrad*ograd
            if (  deriV < minDeri+rangeDeri*oderi ) args->parts[tick % windowSize] = 25;
          }
        }
        tick++;
      }
      int getTick(){
        return tick;
      }
`);