import { useNavigate } from "react-router-dom";
import { CreatePost } from "../components/CreatePost";

export function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Create post</h1>
      <CreatePost onCreated={() => navigate("/feed")} />
    </div>
  );
}
