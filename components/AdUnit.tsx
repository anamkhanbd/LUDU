import React, { useEffect, useRef } from 'react';
import { AdProps } from '../types';

const AdUnit: React.FC<AdProps> = ({ type, position, className }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adContainerRef.current) return;

    // Clear previous content
    adContainerRef.current.innerHTML = '';

    const conf = type === 'banner' ? {
      key: 'df0205346fcf9a2f6b30c76da816afb7',
      height: 90,
      width: 728
    } : {
      key: 'ae1946328ab916a004cf80eb603db8ed',
      height: 600,
      width: 160
    };

    const iframe = document.createElement('iframe');
    iframe.width = conf.width.toString();
    iframe.height = conf.height.toString();
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    
    // Append iframe first so we can access its document
    adContainerRef.current.appendChild(iframe);
    
    try {
      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;overflow:hidden;background-color:transparent;">
              <script type="text/javascript">
                atOptions = {
                  'key': '${conf.key}',
                  'format': 'iframe',
                  'height': ${conf.height},
                  'width': ${conf.width},
                  'params': {}
                };
              </script>
              <script type="text/javascript" src="https://www.highperformanceformat.com/${conf.key}/invoke.js"></script>
            </body>
          </html>
        `);
        iframeDoc.close();
      }
    } catch (e) {
      console.error("Error injecting ad iframe:", e);
    }
  }, [type]);

  return (
    <div 
      className={`ad-container flex justify-center items-center bg-gray-50 dark:bg-gray-800/50 ${className || ''}`}
      ref={adContainerRef}
      style={{
         minHeight: type === 'banner' ? '90px' : '600px',
         minWidth: type === 'banner' ? '300px' : '160px',
         margin: '10px auto',
         overflowX: 'auto',
         maxWidth: '100%'
      }}
    >
    </div>
  );
};

export default AdUnit;