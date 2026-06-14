#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetSnapshotBridge, NSObject)

RCT_EXTERN_METHOD(setSnapshotForMoment:(NSString *)momentId json:(NSString *)json)
RCT_EXTERN_METHOD(removeSnapshotForMoment:(NSString *)momentId)
RCT_EXTERN_METHOD(setCatalogJson:(NSString *)json)
RCT_EXTERN_METHOD(setImageForMoment:(NSString *)momentId sourcePath:(NSString *)sourcePath name:(NSString *)name)
RCT_EXTERN_METHOD(removeImageForMoment:(NSString *)momentId)
RCT_EXTERN_METHOD(reloadTimelines)
RCT_EXTERN_METHOD(setProState:(BOOL)isPro)

@end
