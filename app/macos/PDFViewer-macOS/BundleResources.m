#import "BundleResources.h"

@implementation BundleResources

RCT_EXPORT_MODULE();

// Constants are available synchronously to JS at startup.
- (NSDictionary *)constantsToExport
{
  // The pdfjs folder is bundled as a folder reference at
  // <App>.app/Contents/Resources/pdfjs/viewer.html
  NSString *viewerPath =
      [[NSBundle mainBundle] pathForResource:@"viewer"
                                      ofType:@"html"
                                 inDirectory:@"pdfjs"];
  NSString *viewerURL = viewerPath
      ? [[NSURL fileURLWithPath:viewerPath] absoluteString]
      : @"";
  return @{@"viewerURL": viewerURL ?: @""};
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
