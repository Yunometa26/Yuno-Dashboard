// NOTE: The Mermaid chart and 'react-mermaid2' import are commented out because 'react-mermaid2' is not installed or not available in the deployment environment. Uncomment and ensure the dependency is installed if you want to use Mermaid charts.
'use client'

import { Users } from 'lucide-react'
// import Mermaid from 'react-mermaid2';

export default function ResourcePlanningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="w-full px-4">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Resource Library
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Workflow Image Section */}
        <div className="w-full py-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">Resource Library Workflow</h3>
          <div className="w-full" style={{margin: '8px 0', background: 'transparent', padding: 0}}>
            <div style={{display: 'inline-block', border: '2px solid #011a36', borderRadius: '10px', padding: '1px', background: 'transparent'}}>
              <div className="w-full overflow-x-auto" style={{background: 'transparent', padding: 0}}>
                <div style={{display: 'inline-block', background: 'white', border: '2px solid #011a36', borderRadius: '10px', padding: '8px', margin: '0 auto'}}>
                  {/* Mermaid Flowchart for Resource Library Workflow */}
                  {/* <Mermaid chart={`
                   %%{init: {"theme": "default", "themeVariables": { "primaryTextColor": "#333", "lineColor": "#333", "background": "#fff" }}}%%
                   graph LR
    start1((Start)) --> submit_new_request(Submit New Request)
    submit_new_request -- Submit --> begin_stage_new_request{Begin: Stage New Request}
    begin_stage_new_request --> review_request(Review Request)

    review_request -- Return --> re_submit_request(Re-Submit Request)
    re_submit_request -- Submit --> submit_from_re_submit(Submit)
    re_submit_request -- Cancel PO --> cancel_po(Cancel PO)

    review_request -- Approve --> prepare_po(Prepare PO)
    prepare_po -- Task Complete --> send_po_to_supplier(Send PO to Supplier)

    send_po_to_supplier -- Task Complete --> receive_raw_material(Receive Raw Material)
    receive_raw_material -- Task Complete --> quality_check(Quality Check)
    quality_check -- Task Complete --> receive_rm_in_store(Receive RM In Store)

    receive_rm_in_store -- Task Complete --> is_partial_delivery{Is Partial Delivery?}
    is_partial_delivery -- True --> receive_raw_material_part3("Receive Raw Material")
    is_partial_delivery -- False --> end_stage_new_request_partial{{End: Stage New Request}}

    receive_rm_in_store -- Task Complete --> is_rejected_qty_0{Is Rejected Qty=0?}
    is_rejected_qty_0 -- True --> true_branch_rejected_qty(True)
    is_rejected_qty_0 -- False --> return_rejected_rm("Return Rejected RM")
    return_rejected_rm -- Task Complete --> end_stage_new_request_rejected{{End: Stage New Request}}

    review_request -- Reject --> end_stage_new_request_reject{{End: Stage New Request}}


    style submit_new_request fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style begin_stage_new_request fill:#D4433E,stroke:#D4433E,stroke-width:2px,color:#FFF
    style review_request fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style re_submit_request fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style prepare_po fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style send_po_to_supplier fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style receive_raw_material fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style quality_check fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style receive_rm_in_store fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style return_rejected_rm fill:#F9D78F,stroke:#F9D78F,stroke-width:2px,color:#333
    style receive_raw_material_part3 fill:#34495E,stroke:#34495E,stroke-width:2px,color:#FFF

    style start1 fill:#8BC34A,stroke:#8BC34A,stroke-width:2px,color:#FFF
    style submit_from_re_submit fill:#5D8AA8,stroke:#5D8AA8,stroke-width:2px,color:#FFF
    style cancel_po fill:#5D8AA8,stroke:#5D8AA8,stroke-width:2px,color:#FFF

    style end_stage_new_request_reject fill:#D4433E,stroke:#D4433E,stroke-width:2px,color:#FFF
    style end_stage_new_request_partial fill:#D4433E,stroke:#D4433E,stroke-width:2px,color:#FFF
    style end_stage_new_request_rejected fill:#D4433E,stroke:#D4433E,stroke-width:2px,color:#FFF

    style is_partial_delivery fill:#8A2BE2,stroke:#8A2BE2,stroke-width:2px,color:#FFF
    style is_rejected_qty_0 fill:#8A2BE2,stroke:#8A2BE2,stroke-width:2px,color:#FFF
    style true_branch_rejected_qty fill:#8BC34A,stroke:#8BC34A,stroke-width:2px,color:#FFF
                 `} style={{display: 'block', margin: '0 auto'}} /> */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Downward Arrow from Flowchart to Form Example */}
        <div className="flex justify-center mb-8 mt-2">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 8V40M24 40L12 28M24 40L36 28" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* Form and Table Example Stacked Vertically */}
        <div className="w-full py-4">
          {/* Form Example */}
          <div className="flex flex-col items-center w-full mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">Raw Materials Procurement Form Example</h3>
            <div style={{border: '2px solid #011a36', borderRadius: '10px', padding: '1px', background: 'transparent', display: 'inline-block', margin: '0 auto'}}>
              <img src="/procurement-form-example.png" alt="Raw Materials Procurement Form Example" style={{width: '100%', maxWidth: '900px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto'}} />
            </div>
          </div>
          {/* Downward Arrow */}
          <div className="flex justify-center mb-8">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 8V40M24 40L12 28M24 40L36 28" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Table Example */}
          <div className="flex flex-col items-center w-full">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">Stock Table Example</h3>
            <div style={{border: '2px solid #011a36', borderRadius: '10px', padding: '1px', background: 'transparent', display: 'inline-block', margin: '0 auto'}}>
              <img src="/stock-table-example.png" alt="Stock Table Example" style={{width: '100%', maxWidth: '900px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto'}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 