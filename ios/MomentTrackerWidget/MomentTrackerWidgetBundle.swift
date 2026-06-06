//
//  MomentTrackerWidgetBundle.swift
//  MomentTrackerWidget
//
//  Created by Oktay Shakirov on 07.06.26.
//

import WidgetKit
import SwiftUI

@main
struct MomentTrackerWidgetBundle: WidgetBundle {
    var body: some Widget {
        MomentTrackerWidget()
        MomentTrackerWidgetControl()
        MomentTrackerWidgetLiveActivity()
    }
}
