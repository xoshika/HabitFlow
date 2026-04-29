import { useEffect, useState } from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

const ProfilePage = ({ user }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get(`/api/profile/${user.id}`).then((res) => setProfile(res.data));
  }, [user.id]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Profile
      </Typography>
      <Stack spacing={1}>
        <Typography>Name: {profile?.name ?? user?.name}</Typography>
        <Typography>Email: {profile?.email ?? user?.email}</Typography>
        <Typography>
          Total Habits: {profile?.stats?.total_habits ?? 0}
        </Typography>
        <Typography>
          Total Check-ins: {profile?.stats?.total_checkins ?? 0}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default ProfilePage;
