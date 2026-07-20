#import "FilePicker.h"
#import <AppKit/AppKit.h>

@implementation FilePicker

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(openPDF:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    panel.allowedFileTypes = @[@"pdf"];
    panel.allowsMultipleSelection = NO;
    panel.canChooseDirectories = NO;
    panel.canChooseFiles = YES;

    NSInteger result = [panel runModal];
    if (result != NSModalResponseOK || panel.URL == nil) {
      resolve([NSNull null]);
      return;
    }

    NSURL *url = panel.URL;
    NSError *error = nil;
    NSData *data = [NSData dataWithContentsOfURL:url options:0 error:&error];
    if (!data) {
      reject(@"read_failed", error.localizedDescription ?: @"Could not read file", error);
      return;
    }

    resolve(@{
      @"name": url.lastPathComponent ?: @"document.pdf",
      @"path": url.path ?: @"",
      @"base64": [data base64EncodedStringWithOptions:0],
    });
  });
}

RCT_EXPORT_METHOD(saveBytes:(NSString *)path
                  base64:(NSString *)base64
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSData *data = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
  if (!data) {
    reject(@"decode_failed", @"Could not decode base64 payload", nil);
    return;
  }

  // Atomic write: write to a temp file in the same directory, then replace.
  NSFileManager *fm = [NSFileManager defaultManager];
  NSString *dir = [path stringByDeletingLastPathComponent];
  NSString *tempPath = [dir stringByAppendingPathComponent:
                         [NSString stringWithFormat:@".%@.tmp", [[NSUUID UUID] UUIDString]]];

  NSError *writeError = nil;
  if (![data writeToFile:tempPath options:NSDataWritingAtomic error:&writeError]) {
    reject(@"write_failed", writeError.localizedDescription ?: @"Could not write file", writeError);
    return;
  }

  NSError *replaceError = nil;
  NSURL *tempURL = [NSURL fileURLWithPath:tempPath];
  NSURL *destURL = [NSURL fileURLWithPath:path];
  if (![fm replaceItemAtURL:destURL
              withItemAtURL:tempURL
             backupItemName:nil
                    options:0
           resultingItemURL:nil
                      error:&replaceError]) {
    [fm removeItemAtPath:tempPath error:nil];
    reject(@"replace_failed", replaceError.localizedDescription ?: @"Could not replace file", replaceError);
    return;
  }

  resolve(@YES);
}

RCT_EXPORT_METHOD(saveAsPDF:(NSString *)suggestedName
                  base64:(NSString *)base64
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSSavePanel *panel = [NSSavePanel savePanel];
    panel.allowedFileTypes = @[@"pdf"];
    panel.nameFieldStringValue = suggestedName ?: @"document.pdf";

    NSInteger result = [panel runModal];
    if (result != NSModalResponseOK || panel.URL == nil) {
      resolve([NSNull null]);
      return;
    }

    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
    if (!data) {
      reject(@"decode_failed", @"Could not decode base64 payload", nil);
      return;
    }

    NSError *error = nil;
    if (![data writeToURL:panel.URL options:NSDataWritingAtomic error:&error]) {
      reject(@"write_failed", error.localizedDescription ?: @"Could not write file", error);
      return;
    }

    resolve(@{@"path": panel.URL.path ?: @"", @"name": panel.URL.lastPathComponent ?: suggestedName});
  });
}

@end
