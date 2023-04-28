import { Slider } from '@mui/material';
import '../App.css';
import { PlanMeta } from '../utils/RecordSerializer';

export function ActivitySliders(props: { planMeta: PlanMeta, setPlanMeta: (planMeta: PlanMeta) => void }) {
    return <>
        <Slider
            min={5}
            max={50}
            step={1}
            onChange={(_, val) => {
                props.setPlanMeta({ ...props.planMeta, strengthRatio: +val });
            }}
            marks={[
                { value: 10, label: "Weak" },
                { value: 25, label: "Average" },
                { value: 40, label: "Strong" },
            ]}
            defaultValue={props.planMeta.strengthRatio}
            sx={{ width: "80%", left: "10%" }} />
        <Slider
            min={5}
            max={40}
            step={1}
            marks={[
                { value: 10, label: "Strength" },
                { value: 20, label: "Balance" },
                { value: 30, label: "Durable" },
            ]}
            onChange={(_, val) => {
                props.setPlanMeta({ ...props.planMeta, amountRatio: +val });
            }}
            defaultValue={props.planMeta.amountRatio}
            sx={{ width: "80%", left: "10%" }} />
        <Slider
            min={0.2}
            max={40}
            step={0.2}
            marks={[
                { value: 1, label: "Low" },
                { value: 20, label: "Mid" },
                { value: 30, label: "High" },
            ]}
            onChange={(_, val) => {
                props.setPlanMeta({ ...props.planMeta, expectedCalory: +val });
            }}
            defaultValue={props.planMeta.expectedCalory}
            sx={{ width: "80%", left: "10%" }} />
    </>
}