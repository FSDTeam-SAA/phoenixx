
const PostContentRenderer = () => {
  // Your sample post data
  const post = {
    content: `<ul class="list-disc pl-5"><li><p>sdfsdf</p></li><li><p>sdfsd</p></li><li><p>sdfsd</p></li></ul><p></p><ol class="list-decimal pl-5"><li><p>sdfsf</p></li><li><p>sdfsd</p></li><li><p>sdfsdf</p></li></ol><p></p><p></p><p><strong>sdfsd</strong></p><p><em>sdfsdf</em></p><p></p><p><u>sdfsdfsdf</u></p>`
  };

  // Clean HTML content while preserving formatting
  const cleanPostContent = (content) => {
    if (!content) return '';

    // Remove Froala "Powered by" footer
    let processedContent = content.replace(
      /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
      ''
    );

    // Convert empty paragraphs to single line breaks
    processedContent = processedContent.replace(/<p[^>]*>\s*<\/p>/gi, '<br>');

    // Clean up excessive empty paragraphs but preserve some spacing
    processedContent = processedContent.replace(/(<br>\s*){3,}/gi, '<br><br>');

    return processedContent.trim();
  };

  // Custom CSS styles for proper list display
  const contentStyles = {
    lineHeight: '1.6',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  // CSS for lists to ensure proper display
  const listStyles = `
    .content-display ul {
      list-style-type: disc;
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .content-display ol {
      list-style-type: decimal;
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .content-display li {
      margin-bottom: 0.25rem;
    }
    .content-display strong {
      font-weight: bold;
    }
    .content-display em {
      font-style: italic;
    }
    .content-display u {
      text-decoration: underline;
    }
    .content-display p {
      margin-bottom: 0.5rem;
    }
    .content-display br {
      line-height: 1.5;
    }
  `;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <style>{listStyles}</style>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Original Function (Plain Text)</h2>
        <div className="bg-gray-100 p-4 rounded border">
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {/* Your original function output for comparison */}
            {(() => {
              const decodeHtmlEntities = (text) => {
                if (!text) return '';
                const textArea = document.createElement('textarea');
                textArea.innerHTML = text;
                return textArea.value;
              };

              const originalCleanPostContent = (content) => {
                if (!content) return '';

                const withoutFroala = content.replace(
                  /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
                  ''
                );

                let processedContent = withoutFroala.replace(/<p[^>]*>\s*<\/p>/gi, '<br><br>');

                processedContent = processedContent.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, inner) => {
                  const items = inner.replace(/<li[^>]*>(.*?)<\/li>/gis, (liMatch, liContent) => {
                    return `\n1. ${liContent.replace(/<[^>]+>/g, '').trim()}`;
                  });
                  return items;
                });

                processedContent = processedContent.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, inner) => {
                  const items = inner.replace(/<li[^>]*>(.*?)<\/li>/gis, (liMatch, liContent) => {
                    return `\n• ${liContent.replace(/<[^>]+>/g, '').trim()}`;
                  });
                  return items;
                });

                processedContent = processedContent.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
                processedContent = processedContent.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
                processedContent = processedContent.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
                processedContent = processedContent.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
                processedContent = processedContent.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');

                processedContent = processedContent.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
                processedContent = processedContent.replace(/<\/?p[^>]*>/gi, '');

                processedContent = processedContent.replace(/<\/(div|h[1-6]|section|article)>/gi, '\n');
                processedContent = processedContent.replace(/<(div|h[1-6]|section|article)[^>]*>/gi, '');

                processedContent = processedContent.replace(/<br\s*\/?>/gi, '\n');

                processedContent = processedContent.replace(/<[^>]+>/g, '');

                const decoded = decodeHtmlEntities(processedContent);

                const withPreservedSpacing = decoded.replace(/\n{5,}/g, '\n\n\n\n');

                return withPreservedSpacing.trim();
              };

              return originalCleanPostContent(post.content);
            })()}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">New Function (Formatted HTML)</h2>
        <div className="border border-gray-300 p-4 rounded content-display" style={contentStyles}>
          <div
            dangerouslySetInnerHTML={{
              __html: cleanPostContent(post.content)
            }}
          />
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Updated Code for Your Project:</h3>
        <div className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
          <pre>{`// Updated function - use this instead of your current cleanPostContent
const cleanPostContent = (content) => {
  if (!content) return '';

  // Remove Froala "Powered by" footer
  let processedContent = content.replace(
    /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
    ''
  );

  // Convert empty paragraphs to single line breaks
  processedContent = processedContent.replace(/<p[^>]*>\\s*<\/p>/gi, '<br>');

  // Clean up excessive empty paragraphs but preserve some spacing
  processedContent = processedContent.replace(/(<br>\\s*){3,}/gi, '<br><br>');

  return processedContent.trim();
};

// In your JSX, render it like this:
<div 
  className="post-content" 
  dangerouslySetInnerHTML={{
    __html: cleanPostContent(post.content)
  }}
/>

// Add this CSS to your stylesheet:
.post-content ul {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}
.post-content ol {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}
.post-content li {
  margin-bottom: 0.25rem;
}
.post-content strong {
  font-weight: bold;
}
.post-content em {
  font-style: italic;
}
.post-content u {
  text-decoration: underline;
}
.post-content p {
  margin-bottom: 0.5rem;
}`}</pre>
        </div>
      </div>
    </div>
  );
};

export default PostContentRenderer;