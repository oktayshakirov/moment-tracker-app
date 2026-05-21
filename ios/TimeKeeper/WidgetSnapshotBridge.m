#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetSnapshotBridge, NSObject)

RCT_EXTERN_METHOD(setSnapshotForMoment:(NSString *)momentId json:(NSString *)json)
RCT_EXTERN_METHOD(removeSnapshotForMoment:(NSString *)momentId)
RCT_EXTERN_METHOD(setCatalogJson:(NSString *)json)
RCT_EXTERN_METHOD(reloadTimelines)

@end
