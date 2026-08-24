import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="color-scheme" content="light" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html,
body {
  width: 100%;
  height: 100%;
  background-color: #EEF2F0;
  color-scheme: light;
}

body {
  display: flex;
  justify-content: center;
  margin: 0;
}

#root {
  width: 100%;
  max-width: 430px;
  height: 100%;
  background-color: #FFFFFF;
  box-shadow:
    0 0 0 1px rgba(16, 26, 23, 0.04),
    0 18px 48px rgba(16, 26, 23, 0.14);
}

@media (max-width: 430px) {
  html,
  body {
    background-color: #FFFFFF;
  }

  body {
    display: block;
  }

  #root {
    max-width: none;
    box-shadow: none;
  }
}`;
