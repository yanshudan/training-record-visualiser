import { ActivityRings } from '@jonasdoesthings/react-activity-rings';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import '../App.css';
import { movementDefinitions, movementToPart, today } from '../utils/Constants';
import { BodyStatus, Movement, PlanMeta, Record } from '../utils/RecordSerializer';
import { DateDiffInDays, MinusDays } from '../utils/Utils';

export function Activities(props: {
  records: Record[],
  current: BodyStatus,
  target: BodyStatus,
  planMeta: PlanMeta,
}) {
  const totalDays = 28;

  return <Grid container columns={{ xs: 7, sm: 8, md: 12 }}>
    {Array.from(Array(totalDays + 7)).map((_, index) => {
      const daydiff = totalDays - (index - today.getDay());
      const row = props.records.find((r) => DateDiffInDays(today, r.date) === daydiff);
      const date = MinusDays(daydiff);

      const planProgress = DateDiffInDays(date, new Date(props.planMeta.start));
      const planBase = 300 * Math.log(props.planMeta.FFMIlimit - props.current.FFMI) / (-props.planMeta.growthRatio);
      const expectedFFMI = props.planMeta.FFMIlimit - Math.exp(-props.planMeta.growthRatio * (planProgress + planBase) / 300);
      const expectedStrength = (expectedFFMI - 18) * props.planMeta.strengthRatio;
      const expectedAmount = (expectedFFMI - 18) * props.planMeta.amountRatio;
      const getRings = () => {
        if (daydiff < 0 || daydiff >= totalDays) {
          return [
            { filledPercentage: 0.35, color: "#" },
            { filledPercentage: 0.55, color: "#" },
            { filledPercentage: 0.75, color: "#" },
            { filledPercentage: 0.55, color: "#" },
            { filledPercentage: 0.75, color: "#" },]
        }
        if (row === undefined) {
          return [
            { filledPercentage: 0.35, color: "#555555" },
            { filledPercentage: 0.55, color: "#444444" },
            { filledPercentage: 0.55, color: "#333333" },
            { filledPercentage: 0.75, color: "#222222" },
            { filledPercentage: 0.75, color: "#191919" },]
        }
        // const colorconfig = movementDefinitions[row.topic] || { inColor: "#457457", outColor: "#754754" };
        const cardioSet = row.movements.find((m: Movement) => movementToPart.get(m.name) === "Cardio");
        const bodySet = row.movements.find((m: Movement) => {
          const part = movementToPart.get(m.name)
          return part === "Legs" || part === "Chest" || part === "Back";
        });
        const armSet = row.movements.find((m: Movement) => {
          const part = movementToPart.get(m.name)
          return part === "Bicep" || part === "Tricep";
        });
        return [
          {
            filledPercentage: cardioSet === undefined ? 0.75 :
              cardioSet.sets.map(s => s.weight * s.reps).reduce((a, b) => a + b, 0) / (expectedFFMI * props.planMeta.expectedCalory),
            color: cardioSet === undefined ? "#555555" : "#ffffff"
          },
          {
            filledPercentage: bodySet === undefined ? 0.75 :
              bodySet.sets.map(s => s.reps).reduce((a, b) => a + b, 0) / expectedAmount,
            color: bodySet === undefined ? "#444444" : movementDefinitions.get(movementToPart.get(bodySet.name)!)!.theme.inColor
          },
          {
            filledPercentage: bodySet === undefined ? 0.75 :
              bodySet.sets[0].weight / expectedStrength,
            color: bodySet === undefined ? "#333333" : movementDefinitions.get(movementToPart.get(bodySet.name)!)!.theme.outColor
          },
          {
            filledPercentage: armSet === undefined ? 0.75 :
              armSet.sets.map(s => s.reps).reduce((a, b) => a + b, 0) / expectedAmount,
            color: armSet === undefined ? "#222222" : movementDefinitions.get(movementToPart.get(armSet.name)!)!.theme.inColor
          },
          {
            filledPercentage: armSet === undefined ? 0.75 :
              armSet.sets[0].weight / expectedStrength,
            color: armSet === undefined ? "#191919" : movementDefinitions.get(movementToPart.get(armSet.name)!)!.theme.outColor
          },
        ];
      }
      return <Grid item xs={1} sm={4} md={4} key={index}>
        <ActivityRings rings={getRings()} />
        <Typography sx={{ position: "relative", transform: "translateX(20%)", top: "-30%", color: "#555555" }}>{`${date.getMonth() + 1}/${date.getDate()}`}</Typography>
      </Grid>
    })}
  </Grid>
}
