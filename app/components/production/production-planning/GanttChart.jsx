'use client';

import React from 'react';
import Paper from '@mui/material/Paper';
import {
  ViewState,
} from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  Appointments,
  Resources,
  AppointmentTooltip,
} from '@devexpress/dx-react-scheduler-material-ui';

const PRIORITY_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
  Normal: "#3b82f6"
};

// Custom appointment component with priority-based colors
const Appointment = ({ children, style, data, ...restProps }) => {
  const priorityColor = PRIORITY_COLORS[data.priority] || PRIORITY_COLORS.Normal;
  
  return (
    <Appointments.Appointment
      {...restProps}
      style={{
        ...style,
        backgroundColor: priorityColor,
        borderRadius: '8px',
        opacity: 0.9,
      }}
    >
      {children}
    </Appointments.Appointment>
  );
};

// Custom tooltip content
const Content = ({ children, appointmentData, ...restProps }) => (
  <AppointmentTooltip.Content {...restProps} appointmentData={appointmentData}>
    <div className="px-4 py-2">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Order ID:</div>
        <div>{appointmentData.orderId}</div>
        <div className="font-medium">SKU:</div>
        <div>{appointmentData.sku}</div>
        <div className="font-medium">Quantity:</div>
        <div>{appointmentData.quantity.toLocaleString()}</div>
        <div className="font-medium">Priority:</div>
        <div>{appointmentData.priority}</div>
        <div className="font-medium">Speed:</div>
        <div>{appointmentData.speed} Units/hr</div>
      </div>
    </div>
  </AppointmentTooltip.Content>
);

export default function GanttChart({ data, selectedLine }) {
  // Transform production data into scheduler appointments
  const appointments = data
    .filter(item => selectedLine === 'All' || item.ProductionLine === selectedLine)
    .map(item => ({
      id: `${item.OrderID}-${item.SKU}`,
      title: `${item.SKU} (${item.OrderID})`,
      startDate: item.StartDate,
      endDate: item.EndDate,
      orderId: item.OrderID,
      sku: item.SKU,
      quantity: item.PlannedQuantity,
      priority: item.Priority,
      speed: item.Speed,
      line: item.ProductionLine,
    }));

  // Resources configuration for grouping by production line
  const resources = [{
    fieldName: 'line',
    title: 'Production Line',
    instances: data
      .map(item => item.ProductionLine)
      .filter((value, index, self) => self.indexOf(value) === index)
      .map(line => ({
        id: line,
        text: line,
      })),
  }];

  return (
    <Paper style={{ height: '600px' }} className="bg-[#1a365d]">
      <Scheduler
        data={appointments}
        height={600}
      >
        <ViewState
          defaultCurrentDate={appointments[0]?.startDate || new Date()}
        />
        <DayView
          startDayHour={0}
          endDayHour={24}
          cellDuration={60}
        />
        <Appointments
          appointmentComponent={Appointment}
        />
        <AppointmentTooltip
          contentComponent={Content}
          showCloseButton
        />
        <Resources
          data={resources}
          mainResourceName="line"
        />
      </Scheduler>
    </Paper>
  );
} 